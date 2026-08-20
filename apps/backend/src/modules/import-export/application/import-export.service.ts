import { createReadStream } from 'fs';
import { randomUUID } from 'crypto';
import { Injectable, Inject, BadRequestException, Logger } from '@nestjs/common';
import { AuditAction, Prisma } from '@prisma/client';
import type { Writable } from 'stream';
import { PrismaService } from '../../../database/prisma.service';
import { LOGGER_TOKEN } from '@tienda/logger/nest';
import { IMPORT_EXPORT_CONSTANTS, EXPORT_COLUMNS } from '../constants';
import { parseCsvStream, createCsvSerializer } from './csv/csv.util';
import {
  normalizeRow,
  summarize,
  type ExistingProduct,
  type ExistingVariant,
  type TypedImportRow,
} from './import/product-import.processor';
import { PendingImportStore } from '../infrastructure/pending-import.store';
import type {
  ExportOptions,
  ExportRow,
  ImportPreview,
  ImportResult,
  ImportSummary,
  NormalizedImportRow,
} from '../types/import-export.types';

type Actor = { id?: string; email?: string };

@Injectable()
export class ImportExportService {
  private readonly logger = new Logger(ImportExportService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly pendingStore: PendingImportStore,
    @Inject(LOGGER_TOKEN) private readonly nestLogger: any,
  ) {}

  // ── EXPORT ──────────────────────────────────────────────────────────────

  async exportProducts(tenantId: string, options: ExportOptions, sink: Writable): Promise<number> {
    const defaultPriceList = await this.prisma.priceList.findFirst({
      where: { tenantId, isDefault: true, deletedAt: null },
      select: { id: true },
    });
    const defaultWarehouse = await this.prisma.warehouse.findFirst({
      where: { tenantId, isDefault: true, deletedAt: null },
      select: { id: true },
    });

    const where: Record<string, unknown> = { tenantId, deletedAt: null };
    if (options.status) where['status'] = options.status;
    if (options.search) {
      where['OR'] = [
        { name: { contains: options.search, mode: 'insensitive' } },
        { slug: { contains: options.search, mode: 'insensitive' } },
      ];
    }

    const stringifier = createCsvSerializer();
    stringifier.pipe(sink);

    let emitted = 0;
    let cursor: string | undefined;
    const pageSize = 200;

    for (;;) {
      const products = await this.prisma.product.findMany({
        where: where as never,
        orderBy: { id: 'asc' },
        take: pageSize,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
        select: {
          id: true,
          slug: true,
          name: true,
          shortDescription: true,
          description: true,
          productType: true,
          status: true,
          visibility: true,
          condition: true,
          warrantyMonths: true,
          seoTitle: true,
          seoDescription: true,
        },
      });
      if (products.length === 0) break;

      const productIds = products.map((p) => p.id);
      const variants = await this.prisma.productVariant.findMany({
        where: { tenantId, productId: { in: productIds }, deletedAt: null },
        select: {
          id: true,
          productId: true,
          sku: true,
          name: true,
          barcode: true,
          status: true,
          isDefault: true,
          attributes: true,
        },
      });
      const variantIds = variants.map((v) => v.id);

      const prices = defaultPriceList
        ? await this.prisma.variantPrice.findMany({
            where: { tenantId, priceListId: defaultPriceList.id, productVariantId: { in: variantIds }, deletedAt: null },
            select: {
              productVariantId: true,
              costAmount: true,
              listAmount: true,
              saleAmount: true,
              promotionalAmount: true,
              promotionalStartsAt: true,
              promotionalEndsAt: true,
            },
          })
        : [];
      const inventory = defaultWarehouse
        ? await this.prisma.inventoryItem.findMany({
            where: { tenantId, warehouseId: defaultWarehouse.id, productVariantId: { in: variantIds } },
            select: { productVariantId: true, onHand: true, minimumStock: true },
          })
        : [];

      const priceByVariant = new Map(prices.map((p) => [p.productVariantId, p]));
      const inventoryByVariant = new Map(inventory.map((i) => [i.productVariantId, i]));

      for (const product of products) {
        const productVariants = variants.filter((v) => v.productId === product.id);
        if (productVariants.length === 0) {
          stringifier.write(buildExportRow(product, undefined, undefined, undefined));
          emitted += 1;
        }
        for (const variant of productVariants) {
          stringifier.write(
            buildExportRow(
              product,
              variant,
              priceByVariant.get(variant.id),
              inventoryByVariant.get(variant.id),
            ),
          );
          emitted += 1;
        }
      }

      cursor = products[products.length - 1]?.id;
    }

    stringifier.end();
    return emitted;
  }

  // ── IMPORT: preview (upload + parse + validate + dry-run) ───────────────

  async previewImport(
    tenantId: string,
    actor: Actor,
    filePath: string,
    mode: 'CREATE' | 'UPDATE' | 'UPSERT',
    ip?: string | null,
    userAgent?: string | null,
  ): Promise<ImportPreview> {
    const parsed = await parseCsvStream(createReadStream(filePath), {
      maxRows: IMPORT_EXPORT_CONSTANTS.MAX_ROWS,
      expectedColumns: [...EXPORT_COLUMNS],
    });

    const normalized = await this.resolveAndNormalize(tenantId, parsed.rows);
    const summary = this.buildSummary(normalized);

    const importId = randomUUID();
    this.pendingStore.set(importId, {
      tenantId,
      rows: normalized,
      summary,
      createdAt: Date.now(),
    });

    await this.writeAudit(tenantId, actor, AuditAction.PRODUCT_IMPORT_PREVIEW, {
      importId,
      mode,
      summary: {
        total: summary.total,
        valid: summary.valid,
        invalid: summary.invalid,
        toCreate: summary.toCreate,
        toUpdate: summary.toUpdate,
        noop: summary.noop,
      },
    }, ip, userAgent);

    this.nestLogger.info(
      { event: 'import.preview', tenantId, importId, mode, summary: summary.total },
      'Product import preview created',
    );

    return { importId, mode, summary, rows: normalized };
  }

  // ── IMPORT: confirm (apply in batches, idempotent) ──────────────────────

  async confirmImport(
    tenantId: string,
    actor: Actor,
    importId: string,
    ip?: string | null,
    userAgent?: string | null,
  ): Promise<ImportResult> {
    const existingResult = this.pendingStore.getResult(importId);
    if (existingResult) {
      return { ...existingResult, applied: false };
    }

    const pending = this.pendingStore.get(importId);
    if (!pending) {
      throw new BadRequestException('Import no encontrado o expirado; volvé a subir el archivo');
    }
    if (pending.tenantId !== tenantId) {
      throw new BadRequestException('Import no encontrado para este tenant');
    }

    const { defaultPriceList, defaultWarehouse } = await this.resolveDefaults(tenantId);

    let created = 0;
    let updated = 0;
    let noop = 0;
    const errors: ImportResult['errors'] = [];
    const validRows = pending.rows.filter((row) => row.errors.length === 0);
    const invalidRows = pending.rows.filter((row) => row.errors.length > 0);

    for (const invalid of invalidRows) {
      errors.push({ row: invalid.row, sku: invalid.sku, slug: invalid.slug, errors: invalid.errors });
    }

    for (let index = 0; index < validRows.length; index += IMPORT_EXPORT_CONSTANTS.BATCH_SIZE) {
      const batch = validRows.slice(index, index + IMPORT_EXPORT_CONSTANTS.BATCH_SIZE);
      const outcome = await this.prisma.$transaction(async (tx) => {
        let c = 0;
        let u = 0;
        let n = 0;
        for (const row of batch) {
          const typed = row.typed as unknown as TypedImportRow;
          if (row.action === 'NOOP') {
            n += 1;
            continue;
          }
          const product = await this.upsertProduct(tx, tenantId, typed);
          const variant = await this.upsertVariant(tx, tenantId, product.id, typed);
          if (typed.hasPriceData && defaultPriceList) {
            await this.upsertPrice(tx, tenantId, defaultPriceList.id, variant.id, typed);
          }
          if (typed.hasInventoryData && defaultWarehouse) {
            await this.upsertInventory(tx, tenantId, defaultWarehouse.id, variant.id, typed);
          }
          if (row.action === 'CREATE') c += 1;
          else u += 1;
        }
        return { c, u, n };
      });
      created += outcome.c;
      updated += outcome.u;
      noop += outcome.n;
    }

    const result: ImportResult = {
      importId,
      applied: true,
      created,
      updated,
      noop,
      errors,
    };
    this.pendingStore.complete(importId, result);

    await this.writeAudit(tenantId, actor, AuditAction.PRODUCT_IMPORT_CONFIRM, {
      importId,
      created,
      updated,
      noop,
      errors: errors.length,
    }, ip, userAgent);

    this.nestLogger.info(
      { event: 'import.confirm', tenantId, importId, created, updated, noop, errors: errors.length },
      'Product import confirmed',
    );

    return result;
  }

  // ── helpers ─────────────────────────────────────────────────────────────

  private async resolveAndNormalize(tenantId: string, rows: Record<string, string | null>[]) {
    const skus = rows.map((r) => r['sku']?.trim()).filter(Boolean);
    const slugs = rows.map((r) => r['slug']?.trim()).filter(Boolean);

    const productSelect = {
      id: true,
      slug: true,
      name: true,
      status: true,
      visibility: true,
      productType: true,
      condition: true,
      warrantyMonths: true,
      shortDescription: true,
      description: true,
      seoTitle: true,
      seoDescription: true,
    } as const;

    const [products, variants] = await Promise.all([
      this.prisma.product.findMany({
        where: { tenantId, deletedAt: null, slug: { in: slugs as string[] } },
        select: productSelect,
      }),
      this.prisma.productVariant.findMany({
        where: { tenantId, deletedAt: null, sku: { in: skus as string[] } },
        select: {
          id: true,
          productId: true,
          sku: true,
          name: true,
          barcode: true,
          status: true,
          isDefault: true,
          attributes: true,
        },
      }),
    ]);

    const variantProductIds = [...new Set(variants.map((v) => v.productId))];
    const variantProducts = await this.prisma.product.findMany({
      where: { tenantId, deletedAt: null, id: { in: variantProductIds } },
      select: productSelect,
    });

    const productBySlug = new Map<string, ExistingProduct>(
      products.map((p) => [p.slug, p as ExistingProduct]),
    );
    const variantProductById = new Map(variantProducts.map((p) => [p.id, p as ExistingProduct]));
    const variantBySku = new Map<string, ExistingVariant>();
    for (const v of variants) {
      const product = variantProductById.get(v.productId);
      if (product) {
        variantBySku.set(v.sku, { ...v, attributes: v.attributes as unknown, product } as ExistingVariant);
      }
    }

    const seenSkus = new Set<string>();
    return rows.map((row, index) => {
      const sku = (row['sku'] ?? '').trim();
      if (sku && seenSkus.has(sku)) {
        const normalized = normalizeRow(row, index + 2, {
          variant: variantBySku.get(sku),
        });
        return { ...normalized, errors: [...normalized.errors, 'sku duplicado dentro del archivo'] };
      }
      if (sku) seenSkus.add(sku);
      const slug = (row['slug'] ?? '').trim();
      return normalizeRow(row, index + 2, {
        product: productBySlug.get(slug),
        variant: variantBySku.get(sku),
      });
    });
  }

  private buildSummary(rows: NormalizedImportRow[]): ImportSummary {
    const { valid, invalid, toCreate, toUpdate, noop } = summarize(rows);
    return {
      total: rows.length,
      valid: valid.length,
      invalid: invalid.length,
      toCreate,
      toUpdate,
      noop,
      errors: invalid.map((row) => ({
        row: row.row,
        sku: row.sku,
        slug: row.slug,
        errors: row.errors,
      })),
    };
  }

  private async resolveDefaults(tenantId: string) {
    const [priceList, warehouse] = await Promise.all([
      this.prisma.priceList.findFirst({ where: { tenantId, isDefault: true, deletedAt: null } }),
      this.prisma.warehouse.findFirst({ where: { tenantId, isDefault: true, deletedAt: null } }),
    ]);

    const defaultPriceList =
      priceList ??
      (await this.prisma.priceList.create({
        data: {
          tenantId,
          name: 'Precios',
          code: 'default',
          currency: 'ARS',
          type: 'RETAIL',
          isDefault: true,
          status: 'ACTIVE',
        },
      }));

    const defaultWarehouse =
      warehouse ??
      (await this.prisma.warehouse.create({
        data: {
          tenantId,
          name: 'Depósito principal',
          code: 'main',
          isDefault: true,
          status: 'ACTIVE',
        },
      }));

    return { defaultPriceList, defaultWarehouse };
  }

  private pick<T extends Record<string, unknown>>(values: T): any {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(values)) {
      if (value !== undefined && value !== null) result[key] = value;
    }
    return result;
  }

  private async upsertProduct(
    tx: Prisma.TransactionClient,
    tenantId: string,
    typed: TypedImportRow,
  ): Promise<{ id: string }> {
    const base = this.pick({
      name: typed.name,
      shortDescription: typed.shortDescription,
      description: typed.description,
      productType: typed.productType,
      status: typed.status,
      visibility: typed.visibility,
      condition: typed.condition,
      warrantyMonths: typed.warrantyMonths,
      seoTitle: typed.seoTitle,
      seoDescription: typed.seoDescription,
    });
    return tx.product.upsert({
      where: { tenantId_slug: { tenantId, slug: typed.slug } },
      create: {
        tenantId,
        slug: typed.slug,
        name: typed.name ?? typed.slug,
        ...base,
      },
      update: {
        ...base,
        version: { increment: 1 },
      },
      select: { id: true },
    });
  }

  private async upsertVariant(
    tx: Prisma.TransactionClient,
    tenantId: string,
    productId: string,
    typed: TypedImportRow,
  ): Promise<{ id: string }> {
    const base = this.pick({
      name: typed.variantName,
      barcode: typed.barcode,
      status: typed.variantStatus,
      isDefault: typed.isDefault,
      attributes: typed.attributes,
    });
    return tx.productVariant.upsert({
      where: { tenantId_sku: { tenantId, sku: typed.sku } },
      create: {
        tenantId,
        productId,
        sku: typed.sku,
        ...base,
      },
      update: {
        ...base,
        version: { increment: 1 },
      },
      select: { id: true },
    });
  }

  private async upsertPrice(
    tx: Prisma.TransactionClient,
    tenantId: string,
    priceListId: string,
    productVariantId: string,
    typed: TypedImportRow,
  ): Promise<void> {
    const base = this.pick({
      costAmount: typed.costAmount,
      listAmount: typed.listAmount,
      saleAmount: typed.saleAmount,
      promotionalAmount: typed.promotionalAmount,
      promotionalStartsAt: typed.promotionalStartsAt,
      promotionalEndsAt: typed.promotionalEndsAt,
    });
    await tx.variantPrice.upsert({
      where: {
        tenantId_priceListId_productVariantId_minimumQuantity: {
          tenantId,
          priceListId,
          productVariantId,
          minimumQuantity: 1,
        },
      },
      create: {
        tenantId,
        priceListId,
        productVariantId,
        sku: typed.sku,
        listAmount: typed.listAmount ?? 0,
        ...base,
      },
      update: {
        ...base,
        version: { increment: 1 },
      },
    });
  }

  private async upsertInventory(
    tx: Prisma.TransactionClient,
    tenantId: string,
    warehouseId: string,
    productVariantId: string,
    typed: TypedImportRow,
  ): Promise<void> {
    const base = this.pick({
      onHand: typed.onHand,
      minimumStock: typed.minimumStock,
    });
    await tx.inventoryItem.upsert({
      where: {
        tenantId_warehouseId_productVariantId: {
          tenantId,
          warehouseId,
          productVariantId,
        },
      },
      create: {
        tenantId,
        warehouseId,
        productVariantId,
        sku: typed.sku,
        onHand: typed.onHand ?? 0,
        available: typed.onHand ?? 0,
        minimumStock: typed.minimumStock ?? 0,
      },
      update: {
        ...base,
        available: typed.onHand ?? undefined,
        version: { increment: 1 },
      },
    });
  }

  private async writeAudit(
    tenantId: string,
    actor: Actor,
    action: AuditAction,
    metadata: Record<string, unknown>,
    ip?: string | null,
    userAgent?: string | null,
  ): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        tenantId,
        actorId: actor.id ?? undefined,
        actorEmail: actor.email ?? undefined,
        action,
        entityType: 'PRODUCT_IMPORT',
        metadata: metadata as never,
        ip: ip ?? undefined,
        userAgent: userAgent ?? undefined,
      },
    });
  }
}

function buildExportRow(
  product: {
    slug: string;
    name: string;
    shortDescription: string | null;
    description: string | null;
    productType: string;
    status: string;
    visibility: string;
    condition: string;
    warrantyMonths: number | null;
    seoTitle: string | null;
    seoDescription: string | null;
  },
  variant?: {
    sku: string;
    name: string | null;
    barcode: string | null;
    status: string;
    isDefault: boolean;
    attributes: unknown;
  },
  price?: {
    costAmount: number | null;
    listAmount: number;
    saleAmount: number | null;
    promotionalAmount: number | null;
    promotionalStartsAt: Date | null;
    promotionalEndsAt: Date | null;
  } | null,
  inventory?: { onHand: number; minimumStock: number } | null,
): ExportRow {
  return {
    slug: product.slug,
    name: product.name,
    shortDescription: product.shortDescription ?? '',
    description: product.description ?? '',
    productType: product.productType,
    status: product.status,
    visibility: product.visibility,
    condition: product.condition,
    warrantyMonths: product.warrantyMonths ?? '',
    seoTitle: product.seoTitle ?? '',
    seoDescription: product.seoDescription ?? '',
    sku: variant?.sku ?? '',
    variantName: variant?.name ?? '',
    barcode: variant?.barcode ?? '',
    variantStatus: variant?.status ?? '',
    isDefault: variant ? (variant.isDefault ? 'true' : 'false') : '',
    attributes: variant ? JSON.stringify(variant.attributes ?? []) : '',
    costAmount: price?.costAmount ?? '',
    listAmount: price?.listAmount ?? '',
    saleAmount: price?.saleAmount ?? '',
    promotionalAmount: price?.promotionalAmount ?? '',
    promotionalStartsAt: price?.promotionalStartsAt?.toISOString() ?? '',
    promotionalEndsAt: price?.promotionalEndsAt?.toISOString() ?? '',
    onHand: inventory?.onHand ?? '',
    minimumStock: inventory?.minimumStock ?? '',
  };
}