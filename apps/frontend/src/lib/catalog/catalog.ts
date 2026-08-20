import { Prisma } from '@prisma/client';
import { prisma } from '@lib/auth/prisma';
import { createSlug } from '@tienda/ui';

export const CATALOG_STATUSES = ['DRAFT', 'ACTIVE', 'INACTIVE', 'ARCHIVED'] as const;
export const CATALOG_VISIBILITIES = ['PUBLIC', 'PRIVATE', 'HIDDEN'] as const;
export const COLLECTION_TYPES = ['MANUAL', 'RULE_BASED', 'TEMPORARY', 'FEATURED'] as const;
export const BRAND_STATUSES = ['DRAFT', 'ACTIVE', 'INACTIVE', 'ARCHIVED'] as const;
export const BRAND_VISIBILITIES = ['PUBLIC', 'PRIVATE', 'HIDDEN'] as const;

export type CatalogStatusValue = (typeof CATALOG_STATUSES)[number];
export type CatalogVisibilityValue = (typeof CATALOG_VISIBILITIES)[number];
export type CollectionTypeValue = (typeof COLLECTION_TYPES)[number];
export type BrandStatusValue = (typeof BRAND_STATUSES)[number];
export type BrandVisibilityValue = (typeof BRAND_VISIBILITIES)[number];

export type CategoryInput = {
  name: string;
  slug?: string;
  parentId?: string | null;
  description?: string | null;
  shortDescription?: string | null;
  status: CatalogStatusValue;
  visibility: CatalogVisibilityValue;
  displayOrder?: number;
  icon?: string | null;
  image?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
};

export type CollectionInput = {
  name: string;
  slug?: string;
  description?: string | null;
  type: CollectionTypeValue;
  status: CatalogStatusValue;
  visibility: CatalogVisibilityValue;
  displayOrder?: number;
  startAt?: string | null;
  endAt?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
};

export type BrandInput = {
  name: string;
  slug?: string;
  description?: string | null;
  logoUrl?: string | null;
  websiteUrl?: string | null;
  status: BrandStatusValue;
  visibility: BrandVisibilityValue;
  seoTitle?: string | null;
  seoDescription?: string | null;
};

export class CatalogCrudError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
  }
}

export type CatalogField = {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'number' | 'date' | 'parent';
  options?: readonly string[];
};

function assertEnum<T extends string>(value: string, allowed: readonly T[], label: string): T {
  if (!allowed.includes(value as T)) {
    throw new CatalogCrudError(`${label} inválido (${allowed.join('/')})`, 400);
  }
  return value as T;
}

function normalizeName(value: string): string {
  const name = value.trim();
  if (!name) throw new CatalogCrudError('El nombre es obligatorio', 400);
  return name;
}

function normalizeSlug(inputSlug: string | undefined, name: string): string {
  const slug = inputSlug?.trim() ? createSlug(inputSlug) : createSlug(name);
  if (!slug) throw new CatalogCrudError('El slug no puede estar vacío', 400);
  return slug;
}

function toNullableString(value: unknown): string | null {
  if (value === undefined || value === null) return null;
  const s = String(value).trim();
  return s === '' ? null : s;
}

function toInt(value: unknown): number {
  if (value === undefined || value === null || value === '') return 0;
  const n = Number(value);
  if (!Number.isInteger(n) || n < 0) throw new CatalogCrudError('displayOrder debe ser un entero >= 0', 400);
  return n;
}

function toDate(value: unknown): Date | null {
  if (value === undefined || value === null || value === '') return null;
  const d = new Date(String(value));
  if (Number.isNaN(d.getTime())) throw new CatalogCrudError('Fecha inválida (usá formato ISO)', 400);
  return d;
}

async function assertCategoryParent(tenantId: string, parentId: string | null | undefined): Promise<void> {
  if (!parentId) return;
  const parent = await prisma.category.findFirst({
    where: { tenantId, id: parentId, deletedAt: null },
  });
  if (!parent) throw new CatalogCrudError('Categoría padre no encontrada', 400);
}

export async function listCategories(
  tenantId: string,
  filters: { q?: string; status?: string; page: number; pageSize: number },
): Promise<{ items: unknown[]; total: number; page: number; pageSize: number }> {
  const where: Prisma.CategoryWhereInput = {
    tenantId,
    deletedAt: null,
    ...(filters.q?.trim()
      ? { OR: [{ name: { contains: filters.q.trim(), mode: 'insensitive' } }, { slug: { contains: filters.q.trim(), mode: 'insensitive' } }] }
      : {}),
    ...(filters.status ? { status: assertEnum(filters.status, CATALOG_STATUSES, 'status') } : {}),
  };

  const [total, rows] = await prisma.$transaction([
    prisma.category.count({ where }),
    prisma.category.findMany({
      where,
      orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
      skip: (filters.page - 1) * filters.pageSize,
      take: filters.pageSize,
      include: { parent: { select: { id: true, name: true } } },
    }),
  ]);

  return { items: rows, total, page: filters.page, pageSize: filters.pageSize };
}

export async function createCategory(tenantId: string, input: CategoryInput): Promise<{ id: string }> {
  const name = normalizeName(input.name);
  const slug = normalizeSlug(input.slug, name);
  await assertCategoryParent(tenantId, input.parentId);

  const existing = await prisma.category.findUnique({ where: { tenantId_slug: { tenantId, slug } } });
  if (existing) throw new CatalogCrudError('Ya existe una categoría con ese slug', 409);

  const created = await prisma.category.create({
    data: {
      tenantId,
      name,
      slug,
      parentId: input.parentId ?? null,
      description: toNullableString(input.description),
      shortDescription: toNullableString(input.shortDescription),
      status: assertEnum(input.status, CATALOG_STATUSES, 'status'),
      visibility: assertEnum(input.visibility, CATALOG_VISIBILITIES, 'visibility'),
      displayOrder: toInt(input.displayOrder),
      icon: toNullableString(input.icon),
      image: toNullableString(input.image),
      seoTitle: toNullableString(input.seoTitle),
      seoDescription: toNullableString(input.seoDescription),
    },
  });

  return { id: created.id };
}

export async function updateCategory(
  tenantId: string,
  id: string,
  input: CategoryInput,
  expectedVersion: number,
): Promise<{ id: string; version: number }> {
  const current = await prisma.category.findFirst({ where: { tenantId, id, deletedAt: null } });
  if (!current) throw new CatalogCrudError('Categoría no encontrada', 404);
  if (current.version !== expectedVersion) throw new CatalogCrudError('La categoría fue modificada por otro usuario', 409);

  const name = normalizeName(input.name);
  const slug = normalizeSlug(input.slug, name);
  if (slug !== current.slug) {
    const duplicate = await prisma.category.findUnique({ where: { tenantId_slug: { tenantId, slug } } });
    if (duplicate) throw new CatalogCrudError('Ya existe una categoría con ese slug', 409);
  }
  await assertCategoryParent(tenantId, input.parentId);

  const updated = await prisma.category.update({
    where: { id },
    data: {
      name,
      slug,
      parentId: input.parentId ?? null,
      description: toNullableString(input.description),
      shortDescription: toNullableString(input.shortDescription),
      status: assertEnum(input.status, CATALOG_STATUSES, 'status'),
      visibility: assertEnum(input.visibility, CATALOG_VISIBILITIES, 'visibility'),
      displayOrder: toInt(input.displayOrder),
      icon: toNullableString(input.icon),
      image: toNullableString(input.image),
      seoTitle: toNullableString(input.seoTitle),
      seoDescription: toNullableString(input.seoDescription),
      version: { increment: 1 },
    },
  });

  return { id: updated.id, version: updated.version };
}

export async function deleteCategory(tenantId: string, id: string): Promise<void> {
  const current = await prisma.category.findFirst({ where: { tenantId, id, deletedAt: null } });
  if (!current) throw new CatalogCrudError('Categoría no encontrada', 404);

  const children = await prisma.category.count({ where: { tenantId, parentId: id, deletedAt: null } });
  if (children > 0) throw new CatalogCrudError('No se puede eliminar: tiene subcategorías', 409);

  await prisma.category.update({ where: { id }, data: { deletedAt: new Date() } });
}

export async function listBrands(
  tenantId: string,
  filters: { q?: string; status?: string; page: number; pageSize: number },
): Promise<{ items: unknown[]; total: number; page: number; pageSize: number }> {
  const where: Prisma.BrandWhereInput = {
    tenantId,
    deletedAt: null,
    ...(filters.q?.trim()
      ? { OR: [{ name: { contains: filters.q.trim(), mode: 'insensitive' } }, { slug: { contains: filters.q.trim(), mode: 'insensitive' } }] }
      : {}),
    ...(filters.status ? { status: assertEnum(filters.status, BRAND_STATUSES, 'status') } : {}),
  };

  const [total, rows] = await prisma.$transaction([
    prisma.brand.count({ where }),
    prisma.brand.findMany({
      where,
      orderBy: [{ name: 'asc' }],
      skip: (filters.page - 1) * filters.pageSize,
      take: filters.pageSize,
    }),
  ]);

  return { items: rows, total, page: filters.page, pageSize: filters.pageSize };
}

export async function createBrand(tenantId: string, input: BrandInput): Promise<{ id: string }> {
  const name = normalizeName(input.name);
  const slug = normalizeSlug(input.slug, name);

  const existing = await prisma.brand.findUnique({ where: { tenantId_slug: { tenantId, slug } } });
  if (existing) throw new CatalogCrudError('Ya existe una marca con ese slug', 409);

  const created = await prisma.brand.create({
    data: {
      tenantId,
      name,
      slug,
      description: toNullableString(input.description),
      logoUrl: toNullableString(input.logoUrl),
      websiteUrl: toNullableString(input.websiteUrl),
      status: assertEnum(input.status, BRAND_STATUSES, 'status'),
      visibility: assertEnum(input.visibility, BRAND_VISIBILITIES, 'visibility'),
      seoTitle: toNullableString(input.seoTitle),
      seoDescription: toNullableString(input.seoDescription),
    },
  });

  return { id: created.id };
}

export async function updateBrand(
  tenantId: string,
  id: string,
  input: BrandInput,
  expectedVersion: number,
): Promise<{ id: string; version: number }> {
  const current = await prisma.brand.findFirst({ where: { tenantId, id, deletedAt: null } });
  if (!current) throw new CatalogCrudError('Marca no encontrada', 404);
  if (current.version !== expectedVersion) throw new CatalogCrudError('La marca fue modificada por otro usuario', 409);

  const name = normalizeName(input.name);
  const slug = normalizeSlug(input.slug, name);
  if (slug !== current.slug) {
    const duplicate = await prisma.brand.findUnique({ where: { tenantId_slug: { tenantId, slug } } });
    if (duplicate) throw new CatalogCrudError('Ya existe una marca con ese slug', 409);
  }

  const updated = await prisma.brand.update({
    where: { id },
    data: {
      name,
      slug,
      description: toNullableString(input.description),
      logoUrl: toNullableString(input.logoUrl),
      websiteUrl: toNullableString(input.websiteUrl),
      status: assertEnum(input.status, BRAND_STATUSES, 'status'),
      visibility: assertEnum(input.visibility, BRAND_VISIBILITIES, 'visibility'),
      seoTitle: toNullableString(input.seoTitle),
      seoDescription: toNullableString(input.seoDescription),
      version: { increment: 1 },
    },
  });

  return { id: updated.id, version: updated.version };
}

export async function deleteBrand(tenantId: string, id: string): Promise<void> {
  const current = await prisma.brand.findFirst({ where: { tenantId, id, deletedAt: null } });
  if (!current) throw new CatalogCrudError('Marca no encontrada', 404);

  const used = await prisma.product.count({ where: { tenantId, brandId: id, deletedAt: null } });
  if (used > 0) throw new CatalogCrudError('No se puede eliminar: tiene productos asociados', 409);

  await prisma.brand.update({ where: { id }, data: { deletedAt: new Date() } });
}

export async function listCollections(
  tenantId: string,
  filters: { q?: string; status?: string; type?: string; page: number; pageSize: number },
): Promise<{ items: unknown[]; total: number; page: number; pageSize: number }> {
  const where: Prisma.CollectionWhereInput = {
    tenantId,
    deletedAt: null,
    ...(filters.q?.trim()
      ? { OR: [{ name: { contains: filters.q.trim(), mode: 'insensitive' } }, { slug: { contains: filters.q.trim(), mode: 'insensitive' } }] }
      : {}),
    ...(filters.status ? { status: assertEnum(filters.status, CATALOG_STATUSES, 'status') } : {}),
    ...(filters.type ? { type: assertEnum(filters.type, COLLECTION_TYPES, 'type') } : {}),
  };

  const [total, rows] = await prisma.$transaction([
    prisma.collection.count({ where }),
    prisma.collection.findMany({
      where,
      orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
      skip: (filters.page - 1) * filters.pageSize,
      take: filters.pageSize,
    }),
  ]);

  return { items: rows, total, page: filters.page, pageSize: filters.pageSize };
}

export async function createCollection(tenantId: string, input: CollectionInput): Promise<{ id: string }> {
  const name = normalizeName(input.name);
  const slug = normalizeSlug(input.slug, name);

  const existing = await prisma.collection.findUnique({ where: { tenantId_slug: { tenantId, slug } } });
  if (existing) throw new CatalogCrudError('Ya existe una colección con ese slug', 409);

  const created = await prisma.collection.create({
    data: {
      tenantId,
      name,
      slug,
      description: toNullableString(input.description),
      type: assertEnum(input.type, COLLECTION_TYPES, 'type'),
      status: assertEnum(input.status, CATALOG_STATUSES, 'status'),
      visibility: assertEnum(input.visibility, CATALOG_VISIBILITIES, 'visibility'),
      displayOrder: toInt(input.displayOrder),
      startAt: toDate(input.startAt),
      endAt: toDate(input.endAt),
      seoTitle: toNullableString(input.seoTitle),
      seoDescription: toNullableString(input.seoDescription),
    },
  });

  return { id: created.id };
}

export async function updateCollection(
  tenantId: string,
  id: string,
  input: CollectionInput,
  expectedVersion: number,
): Promise<{ id: string; version: number }> {
  const current = await prisma.collection.findFirst({ where: { tenantId, id, deletedAt: null } });
  if (!current) throw new CatalogCrudError('Colección no encontrada', 404);
  if (current.version !== expectedVersion) throw new CatalogCrudError('La colección fue modificada por otro usuario', 409);

  const name = normalizeName(input.name);
  const slug = normalizeSlug(input.slug, name);
  if (slug !== current.slug) {
    const duplicate = await prisma.collection.findUnique({ where: { tenantId_slug: { tenantId, slug } } });
    if (duplicate) throw new CatalogCrudError('Ya existe una colección con ese slug', 409);
  }

  const updated = await prisma.collection.update({
    where: { id },
    data: {
      name,
      slug,
      description: toNullableString(input.description),
      type: assertEnum(input.type, COLLECTION_TYPES, 'type'),
      status: assertEnum(input.status, CATALOG_STATUSES, 'status'),
      visibility: assertEnum(input.visibility, CATALOG_VISIBILITIES, 'visibility'),
      displayOrder: toInt(input.displayOrder),
      startAt: toDate(input.startAt),
      endAt: toDate(input.endAt),
      seoTitle: toNullableString(input.seoTitle),
      seoDescription: toNullableString(input.seoDescription),
      version: { increment: 1 },
    },
  });

  return { id: updated.id, version: updated.version };
}

export async function deleteCollection(tenantId: string, id: string): Promise<void> {
  const current = await prisma.collection.findFirst({ where: { tenantId, id, deletedAt: null } });
  if (!current) throw new CatalogCrudError('Colección no encontrada', 404);

  await prisma.collection.update({ where: { id }, data: { deletedAt: new Date() } });
}

export type VariantAttributeStat = { key: string; count: number };

export async function listVariantAttributeKeys(tenantId: string): Promise<VariantAttributeStat[]> {
  const variants = await prisma.productVariant.findMany({
    where: { tenantId, deletedAt: null },
    select: { attributes: true },
    take: 2000,
  });

  const counts = new Map<string, number>();
  for (const variant of variants) {
    const attrs = variant.attributes as Record<string, string | number | boolean>[] | null;
    if (!Array.isArray(attrs)) continue;
    for (const attr of attrs) {
      const key = String(attr['key'] ?? '').trim();
      if (!key) continue;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }

  return [...counts.entries()]
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count || a.key.localeCompare(b.key));
}