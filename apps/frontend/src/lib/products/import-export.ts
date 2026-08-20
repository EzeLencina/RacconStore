import { AuditAction } from '@prisma/client';
import type {
  ProductCondition,
  ProductStatus,
  ProductType,
  ProductVisibility,
  VariantStatus,
} from '@prisma/client';
import { parse } from 'csv-parse';
import { stringify } from 'csv-stringify';
import { Readable } from 'stream';
import { prisma } from '@lib/auth/prisma';
import { writeAudit } from '@lib/auth/audit';
import {
  EXPORT_COLUMNS,
  IMPORT_EXPORT_LIMITS,
  normalizeRow,
  sanitizeCsvCell,
  type ExistingProduct,
  type ExistingVariant,
  type ImportConfirmResult,
  type ImportMode,
  type ImportPreviewResult,
  type NormalizedRow,
  type ParsedRow,
} from './import-export.types';
import { completeImport, getPendingImport, setPendingImport } from './import-pending.store';

export class ImportExportError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
  }
}

function asEnum<T extends string>(value: string | null, fallback: T): T {
  return (value as T) ?? fallback;
}

async function writeImportAudit(
  actor: { id: string; email: string },
  action: AuditAction,
  metadata: Record<string, unknown>,
  ip?: string | null,
  userAgent?: string | null,
): Promise<void> {
  await writeAudit({
    action,
    actorId: actor.id,
    actorEmail: actor.email,
    entityType: 'CATALOG',
    metadata,
    ip,
    userAgent,
  });
}

// ── Shared resolution ─────────────────────────────────────

async function resolveDefaultPriceList(tenantId: string): Promise<{ id: string } | null> {
  const existing = await prisma.priceList.findFirst({
    where: { tenantId, isDefault: true, deletedAt: null },
    select: { id: true },
  });
  if (existing) return existing;
  return prisma.priceList
    .create({
      data: { tenantId, name: 'Lista principal', code: 'default', currency: 'ARS', isDefault: true },
      select: { id: true },
    })
    .catch(() => null);
}

async function resolveDefaultWarehouse(tenantId: string): Promise<{ id: string } | null> {
  const existing = await prisma.warehouse.findFirst({
    where: { tenantId, isDefault: true, deletedAt: null },
    select: { id: true },
  });
  if (existing) return existing;
  return prisma.warehouse
    .create({
      data: { tenantId, name: 'Depósito principal', code: 'default', isDefault: true },
      select: { id: true },
    })
    .catch(() => null);
}

// ── Export ────────────────────────────────────────────────

type ExportRow = Record<string, string | number | boolean | null>;

export async function exportProductsCsv(
  tenantId: string,
  actor: { id: string; email: string },
  ip?: string | null,
  userAgent?: string | null,
): Promise<{ csv: string; count: number }> {
  const priceList = await resolveDefaultPriceList(tenantId);
  const warehouse = await resolveDefaultWarehouse(tenantId);

  const rows: ExportRow[] = [];
  let cursor: string | undefined;

  for (;;) {
    const products = await prisma.product.findMany({
      where: { tenantId, deletedAt: null, ...(cursor ? { id: { gt: cursor } } : {}) },
      orderBy: { id: 'asc' },
      take: 200,
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
    const variants = await prisma.productVariant.findMany({
      where: { tenantId, productId: { in: productIds }, deletedAt: null },
      orderBy: { id: 'asc' },
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
    const prices = priceList
      ? await prisma.variantPrice.findMany({
          where: { tenantId, priceListId: priceList.id, productVariantId: { in: variantIds }, deletedAt: null },
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
    const inventory = warehouse
      ? await prisma.inventoryItem.findMany({
          where: { tenantId, warehouseId: warehouse.id, productVariantId: { in: variantIds } },
          select: { productVariantId: true, onHand: true, minimumStock: true },
        })
      : [];

    const priceByVariant = new Map(prices.map((p) => [p.productVariantId, p]));
    const inventoryByVariant = new Map(inventory.map((i) => [i.productVariantId, i]));

    for (const product of products) {
      const productVariants = variants.filter((v) => v.productId === product.id);
      const variantRows = productVariants.length > 0 ? productVariants : [null];
      for (const variant of variantRows) {
        const price = variant ? priceByVariant.get(variant.id) : undefined;
        const stock = variant ? inventoryByVariant.get(variant.id) : undefined;
        rows.push({
          slug: product.slug,
          name: product.name,
          shortDescription: product.shortDescription,
          description: product.description,
          productType: product.productType,
          status: product.status,
          visibility: product.visibility,
          condition: product.condition,
          warrantyMonths: product.warrantyMonths,
          seoTitle: product.seoTitle,
          seoDescription: product.seoDescription,
          sku: variant?.sku ?? '',
          variantName: variant?.name ?? '',
          barcode: variant?.barcode ?? '',
          variantStatus: variant?.status ?? '',
          isDefault: variant ? variant.isDefault : false,
          attributes: variant ? JSON.stringify(variant.attributes ?? []) : '[]',
          costAmount: price?.costAmount ?? '',
          listAmount: price?.listAmount ?? '',
          saleAmount: price?.saleAmount ?? '',
          promotionalAmount: price?.promotionalAmount ?? '',
          promotionalStartsAt: price?.promotionalStartsAt?.toISOString() ?? '',
          promotionalEndsAt: price?.promotionalEndsAt?.toISOString() ?? '',
          onHand: stock?.onHand ?? '',
          minimumStock: stock?.minimumStock ?? '',
        });
      }
    }

    cursor = products[products.length - 1]!.id;
  }

  const sanitized = rows.map((row) =>
    Object.fromEntries(Object.entries(row).map(([key, value]) => [key, sanitizeCsvCell(value)])),
  );

  const csv = await new Promise<string>((resolve, reject) => {
    stringify(sanitized, { header: true, columns: [...EXPORT_COLUMNS] }, (error, output) => {
      if (error) reject(error);
      else resolve(output);
    });
  });

  await writeImportAudit(actor, AuditAction.PRODUCT_EXPORT, { rows: rows.length }, ip, userAgent);

  return { csv, count: rows.length };
}

// ── Import preview ────────────────────────────────────────

type ColumnMap = Record<string, number>;

function buildColumnMap(header: string[]): ColumnMap {
  const map: ColumnMap = {};
  for (let i = 0; i < header.length; i++) {
    const cell = header[i];
    if (cell === undefined) continue;
    map[cell.toLowerCase().trim()] = i;
  }
  return map;
}

function rowFromColumns(record: string[], columns: ColumnMap): ParsedRow {
  const parsed: ParsedRow = {};
  for (const column of EXPORT_COLUMNS) {
    const index = columns[column.toLowerCase()];
    if (index !== undefined) parsed[column] = record[index] ?? null;
  }
  return parsed;
}

export async function parseCsvStream(
  stream: Readable,
): Promise<{ columns: ColumnMap; rows: ParsedRow[]; tooManyRows: boolean }> {
  const rows: ParsedRow[] = [];
  let columns: ColumnMap = {};
  let tooManyRows = false;

  await new Promise<void>((resolve, reject) => {
    const parser = parse({ bom: true, relax_column_count: true });
    let isHeader = true;
    let count = 0;

    parser.on('data', (record: string[]) => {
      if (isHeader) {
        columns = buildColumnMap(record);
        isHeader = false;
        return;
      }
      count++;
      if (count > IMPORT_EXPORT_LIMITS.MAX_ROWS) {
        tooManyRows = true;
        return;
      }
      rows.push(rowFromColumns(record, columns));
    });
    parser.on('error', reject);
    parser.on('end', resolve);

    stream.pipe(parser);
  });

  return { columns, rows, tooManyRows };
}

export async function previewImport(
  tenantId: string,
  actor: { id: string; email: string },
  file: { stream: () => NodeJS.ReadableStream },
  mode: ImportMode,
  ip?: string | null,
  userAgent?: string | null,
): Promise<ImportPreviewResult> {
  const validModes: ImportMode[] = ['CREATE', 'UPDATE', 'UPSERT'];
  if (!validModes.includes(mode)) {
    throw new ImportExportError('Modo de importación inválido', 400);
  }

  const { columns, rows, tooManyRows } = await parseCsvStream(file.stream() as Readable);
  if (columns['sku'] === undefined) {
    throw new ImportExportError('El archivo debe incluir una columna "sku"', 400);
  }
  if (tooManyRows) {
    throw new ImportExportError(`El archivo supera las ${IMPORT_EXPORT_LIMITS.MAX_ROWS} filas permitidas`, 400);
  }
  if (rows.length === 0) {
    throw new ImportExportError('El archivo no contiene filas de datos', 400);
  }

  const normalized = await resolveAndNormalize(tenantId, rows);

  const errors = normalized
    .filter((row) => row.errors.length > 0)
    .map((row) => ({ row: row.row, sku: row.sku, slug: row.slug, errors: row.errors }));

  const validRows = normalized.filter((row) => row.errors.length === 0);
  const toCreate = validRows.filter((row) => row.action === 'CREATE').length;
  const toUpdate = validRows.filter((row) => row.action === 'UPDATE').length;
  const noop = validRows.filter((row) => row.action === 'NOOP').length;

  const importId = `imp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  setPendingImport(importId, { tenantId, mode, rows: normalized, createdAt: Date.now() });

  await writeImportAudit(
    actor,
    AuditAction.PRODUCT_IMPORT_PREVIEW,
    { importId, mode, total: rows.length, valid: validRows.length, invalid: errors.length },
    ip,
    userAgent,
  );

  return {
    importId,
    mode,
    total: rows.length,
    valid: validRows.length,
    invalid: errors.length,
    toCreate,
    toUpdate,
    noop,
    errors,
  };
}

async function resolveAndNormalize(tenantId: string, rows: ParsedRow[]): Promise<NormalizedRow[]> {
  const skus = [...new Set(rows.map((row) => row['sku'] ?? '').filter(Boolean))];
  const slugs = [...new Set(rows.map((row) => row['slug'] ?? '').filter(Boolean))];

  const variants = skus.length
    ? await prisma.productVariant.findMany({
        where: { tenantId, sku: { in: skus }, deletedAt: null },
        select: { id: true, productId: true, sku: true, name: true, barcode: true, status: true, isDefault: true, attributes: true },
      })
    : [];

  const products = slugs.length
    ? await prisma.product.findMany({
        where: { tenantId, slug: { in: slugs }, deletedAt: null },
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
      })
    : [];

  const productsById = new Map(products.map((p) => [p.id, p]));
  const variantsBySku = new Map(variants.map((v) => [v.sku, v]));
  const productsBySlug = new Map(products.map((p) => [p.slug, p]));

  return rows.map((row, index) => {
    const sku = (row['sku'] ?? '').trim();
    const slug = (row['slug'] ?? '').trim();
    const variant = variantsBySku.get(sku);
    const variantProduct = variant ? productsById.get(variant.productId) : undefined;

    let existingVariant: ExistingVariant | undefined;
    let existingProduct: ExistingProduct | undefined;

    if (variant && variantProduct) {
      existingVariant = {
        sku: variant.sku,
        name: variant.name,
        barcode: variant.barcode,
        status: variant.status,
        isDefault: variant.isDefault,
        attributes: variant.attributes,
        product: {
          slug: variantProduct.slug,
          name: variantProduct.name,
          status: variantProduct.status,
          visibility: variantProduct.visibility,
          productType: variantProduct.productType,
          condition: variantProduct.condition,
          warrantyMonths: variantProduct.warrantyMonths,
          shortDescription: variantProduct.shortDescription,
          description: variantProduct.description,
          seoTitle: variantProduct.seoTitle,
          seoDescription: variantProduct.seoDescription,
        },
      };
    } else if (slug && productsBySlug.has(slug)) {
      const product = productsBySlug.get(slug)!;
      existingProduct = {
        slug: product.slug,
        name: product.name,
        status: product.status,
        visibility: product.visibility,
        productType: product.productType,
        condition: product.condition,
        warrantyMonths: product.warrantyMonths,
        shortDescription: product.shortDescription,
        description: product.description,
        seoTitle: product.seoTitle,
        seoDescription: product.seoDescription,
      };
    }

    return normalizeRow(row, index + 2, { product: existingProduct, variant: existingVariant });
  });
}

// ── Import confirm ────────────────────────────────────────

type Tx = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

export async function confirmImport(
  tenantId: string,
  actor: { id: string; email: string },
  importId: string,
  ip?: string | null,
  userAgent?: string | null,
): Promise<ImportConfirmResult> {
  const pending = getPendingImport(importId);
  if (!pending) {
    const previous = (await import('./import-pending.store')).getCompletedImport(importId);
    if (previous) return previous;
    throw new ImportExportError('Importación no encontrada o expirada. Subí el archivo de nuevo.', 404);
  }

  const rows = pending.rows;
  const priceList = await resolveDefaultPriceList(tenantId);
  const warehouse = await resolveDefaultWarehouse(tenantId);
  const priceListId = priceList?.id ?? null;
  const warehouseId = warehouse?.id ?? null;

  const validRows = rows.filter((row) => row.errors.length === 0);
  let created = 0;
  let updated = 0;
  let noop = 0;
  const errors: ImportConfirmResult['errors'] = [];

  for (let i = 0; i < validRows.length; i += IMPORT_EXPORT_LIMITS.BATCH_SIZE) {
    const batch = validRows.slice(i, i + IMPORT_EXPORT_LIMITS.BATCH_SIZE);
    await prisma.$transaction(async (tx) => {
      for (const row of batch) {
        const typed = row.typed;
        const sku = typed.sku;
        const slug = typed.slug;

        if (row.action === 'NOOP') {
          noop++;
          continue;
        }

        const existingVariant = await tx.productVariant.findFirst({
          where: { tenantId, sku, deletedAt: null },
          select: { id: true, productId: true },
        });

        const existingProduct = existingVariant
          ? await tx.product.findFirst({
              where: { tenantId, id: existingVariant.productId, deletedAt: null },
              select: { id: true },
            })
          : await tx.product.findFirst({
              where: { tenantId, slug, deletedAt: null },
              select: { id: true },
            });

        const isCreate = !existingVariant;
        const skip =
          pending.mode === 'CREATE' ? !isCreate : pending.mode === 'UPDATE' ? isCreate : false;
        if (skip) {
          errors.push({
            row: row.row,
            sku,
            slug,
            errors: [isCreate ? 'El producto no existe (modo UPDATE)' : 'El producto ya existe (modo CREATE)'],
          });
          continue;
        }

        let productId = existingProduct?.id;
        if (!productId) {
          if (!typed.name) {
            errors.push({ row: row.row, sku, slug, errors: ['name es obligatorio para crear el producto'] });
            continue;
          }
          const createdProduct = await tx.product.create({
            data: {
              tenantId,
              name: typed.name,
              slug,
              shortDescription: typed.shortDescription ?? undefined,
              description: typed.description ?? undefined,
              productType: asEnum<ProductType>(typed.productType, 'PHYSICAL'),
              status: asEnum<ProductStatus>(typed.status, 'DRAFT'),
              visibility: asEnum<ProductVisibility>(typed.visibility, 'PUBLIC'),
              condition: asEnum<ProductCondition>(typed.condition, 'NEW'),
              warrantyMonths: typed.warrantyMonths ?? undefined,
              seoTitle: typed.seoTitle ?? undefined,
              seoDescription: typed.seoDescription ?? undefined,
            },
            select: { id: true },
          });
          productId = createdProduct.id;
        }

        let variantId = existingVariant?.id;
        if (isCreate) {
          const createdVariant = await tx.productVariant.create({
            data: {
              tenantId,
              productId,
              sku,
              name: typed.variantName ?? undefined,
              barcode: typed.barcode ?? undefined,
              status: asEnum<VariantStatus>(typed.variantStatus, 'ACTIVE'),
              attributes: (typed.attributes ?? []) as never,
              isDefault: typed.isDefault ?? false,
            },
            select: { id: true },
          });
          variantId = createdVariant.id;
          created++;
        } else {
          await tx.productVariant.update({
            where: { id: existingVariant!.id },
            data: {
              ...(typed.variantName !== null ? { name: typed.variantName } : {}),
              ...(typed.barcode !== null ? { barcode: typed.barcode } : {}),
              ...(typed.variantStatus !== null ? { status: asEnum<VariantStatus>(typed.variantStatus, 'ACTIVE') } : {}),
              ...(typed.isDefault !== null ? { isDefault: typed.isDefault } : {}),
              ...(typed.attributes !== null ? { attributes: typed.attributes as never } : {}),
              version: { increment: 1 },
            },
          });
          updated++;
        }

        if (
          existingProduct &&
          (typed.name !== null ||
            typed.status !== null ||
            typed.productType !== null ||
            typed.visibility !== null ||
            typed.condition !== null ||
            typed.shortDescription !== null ||
            typed.description !== null ||
            typed.warrantyMonths !== null ||
            typed.seoTitle !== null ||
            typed.seoDescription !== null)
        ) {
          await tx.product.update({
            where: { id: existingProduct.id },
            data: {
              ...(typed.name !== null ? { name: typed.name } : {}),
              ...(typed.status !== null ? { status: asEnum<ProductStatus>(typed.status, 'DRAFT') } : {}),
              ...(typed.productType !== null ? { productType: asEnum<ProductType>(typed.productType, 'PHYSICAL') } : {}),
              ...(typed.visibility !== null ? { visibility: asEnum<ProductVisibility>(typed.visibility, 'PUBLIC') } : {}),
              ...(typed.condition !== null ? { condition: asEnum<ProductCondition>(typed.condition, 'NEW') } : {}),
              ...(typed.shortDescription !== null ? { shortDescription: typed.shortDescription } : {}),
              ...(typed.description !== null ? { description: typed.description } : {}),
              ...(typed.warrantyMonths !== null ? { warrantyMonths: typed.warrantyMonths } : {}),
              ...(typed.seoTitle !== null ? { seoTitle: typed.seoTitle } : {}),
              ...(typed.seoDescription !== null ? { seoDescription: typed.seoDescription } : {}),
              version: { increment: 1 },
            },
          });
        }

        if (typed.hasPriceData && priceListId && variantId) {
          await tx.variantPrice.upsert({
            where: {
              tenantId_priceListId_productVariantId_minimumQuantity: {
                tenantId,
                priceListId,
                productVariantId: variantId,
                minimumQuantity: 1,
              },
            },
            update: {
              ...(typed.costAmount !== null ? { costAmount: typed.costAmount } : {}),
              ...(typed.listAmount !== null ? { listAmount: typed.listAmount } : {}),
              ...(typed.saleAmount !== null ? { saleAmount: typed.saleAmount } : {}),
              ...(typed.promotionalAmount !== null ? { promotionalAmount: typed.promotionalAmount } : {}),
              ...(typed.promotionalStartsAt !== null ? { promotionalStartsAt: typed.promotionalStartsAt } : {}),
              ...(typed.promotionalEndsAt !== null ? { promotionalEndsAt: typed.promotionalEndsAt } : {}),
              version: { increment: 1 },
            },
            create: {
              tenantId,
              priceListId,
              productVariantId: variantId,
              sku,
              costAmount: typed.costAmount ?? undefined,
              listAmount: typed.listAmount ?? 0,
              saleAmount: typed.saleAmount ?? undefined,
              promotionalAmount: typed.promotionalAmount ?? undefined,
              promotionalStartsAt: typed.promotionalStartsAt ?? undefined,
              promotionalEndsAt: typed.promotionalEndsAt ?? undefined,
              minimumQuantity: 1,
            },
          });
        }

        if (typed.hasInventoryData && warehouseId && variantId) {
          await tx.inventoryItem.upsert({
            where: {
              tenantId_warehouseId_productVariantId: {
                tenantId,
                warehouseId,
                productVariantId: variantId,
              },
            },
            update: {
              ...(typed.onHand !== null ? { onHand: typed.onHand } : {}),
              ...(typed.minimumStock !== null ? { minimumStock: typed.minimumStock } : {}),
              version: { increment: 1 },
            },
            create: {
              tenantId,
              warehouseId,
              productVariantId: variantId,
              sku,
              onHand: typed.onHand ?? 0,
              minimumStock: typed.minimumStock ?? 0,
            },
          });
        }
      }
    });
  }

  completeImport(importId, { importId, applied: true, created, updated, noop, errors });

  await writeImportAudit(
    actor,
    AuditAction.PRODUCT_IMPORT_CONFIRM,
    { importId, mode: pending.mode, created, updated, noop, failed: errors.length },
    ip,
    userAgent,
  );

  return { importId, applied: true, created, updated, noop, errors };
}