import { Prisma } from '@prisma/client';
import { prisma } from '@lib/auth/prisma';
import {
  PRODUCT_TYPES,
  PRODUCT_STATUSES,
  PRODUCT_VISIBILITIES,
  PRODUCT_CONDITIONS,
  VARIANT_STATUSES,
  ProductCrudError,
  assertEnum,
  normalizeName,
  normalizeSlug,
  toNullableInt,
  toNullableString,
  normalizeVariantAttributes,
  validateProductInput,
  validateVariantInput,
} from './crud.types';
import type { ProductInput, VariantInput, ProductTypeValue, ProductStatusValue } from './crud.types';

export {
  PRODUCT_TYPES,
  PRODUCT_STATUSES,
  PRODUCT_VISIBILITIES,
  PRODUCT_CONDITIONS,
  VARIANT_STATUSES,
  ProductCrudError,
  validateProductInput,
  validateVariantInput,
};
export type {
  ProductInput,
  VariantInput,
  ProductTypeValue,
  ProductStatusValue,
  ProductVisibilityValue,
  ProductConditionValue,
  VariantStatusValue,
} from './crud.types';

export type ProductEditorPayload = {
  id: string;
  name: string;
  slug: string;
  shortDescription: string | null;
  description: string | null;
  productType: string;
  status: string;
  visibility: string;
  condition: string;
  warrantyMonths: number | null;
  brandId: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  version: number;
  createdAt: Date;
  updatedAt: Date;
  publishAt: Date | null;
  unpublishAt: Date | null;
  variants: {
    id: string;
    sku: string;
    name: string | null;
    barcode: string | null;
    status: string;
    isDefault: boolean;
    version: number;
    attributes: Prisma.JsonValue;
  }[];
  categories: { id: string; name: string; slug: string }[];
  collections: { id: string; name: string; slug: string }[];
  brand: { id: string; name: string; slug: string } | null;
};

export type ProductListRow = {
  id: string;
  name: string;
  slug: string;
  status: string;
  productType: string;
  visibility: string;
  createdAt: Date;
  brand: { name: string } | null;
  categories: { category: { name: string } }[];
};

export type ProductListFilters = {
  q?: string;
  status?: string;
  productType?: string;
  brandId?: string;
  categoryId?: string;
};

export async function listProducts(
  tenantId: string,
  filters: ProductListFilters,
  page: number,
  pageSize: number,
): Promise<{ items: ProductListRow[]; total: number; page: number; pageSize: number }> {
  let categoryIds: string[] | undefined;
  if (filters.categoryId) {
    const catRows = await prisma.productCategory.findMany({
      where: { tenantId, categoryId: filters.categoryId },
      select: { productId: true },
    });
    categoryIds = catRows.map((row) => row.productId);
  }

  const where: Prisma.ProductWhereInput = {
    tenantId,
    deletedAt: null,
    ...(filters.q?.trim()
      ? {
          OR: [
            { name: { contains: filters.q.trim(), mode: 'insensitive' } },
            { slug: { contains: filters.q.trim(), mode: 'insensitive' } },
          ],
        }
      : {}),
    ...(filters.status ? { status: assertEnum(filters.status, PRODUCT_STATUSES, 'status') } : {}),
    ...(filters.productType ? { productType: assertEnum(filters.productType, PRODUCT_TYPES, 'productType') } : {}),
    ...(filters.brandId ? { brandId: filters.brandId } : {}),
    ...(categoryIds ? { id: { in: categoryIds } } : {}),
  };

  const [total, rows] = await prisma.$transaction([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        name: true,
        slug: true,
        status: true,
        productType: true,
        visibility: true,
        createdAt: true,
        brandId: true,
      },
    }),
  ]);

  const productIds = rows.map((row) => row.id);
  const brandIds = [...new Set(rows.map((row) => row.brandId).filter((id): id is string => Boolean(id)))];
  const brandMap = new Map<string, string>();
  if (brandIds.length > 0) {
    const brands = await prisma.brand.findMany({
      where: { id: { in: brandIds } },
      select: { id: true, name: true },
    });
    for (const brand of brands) brandMap.set(brand.id, brand.name);
  }

  const categoryMap = new Map<string, string>();
  const catAssignments = new Map<string, string[]>();
  if (productIds.length > 0) {
    const catRows = await prisma.productCategory.findMany({
      where: { tenantId, productId: { in: productIds } },
      select: { productId: true, categoryId: true },
    });
    for (const row of catRows) {
      const list = catAssignments.get(row.productId) ?? [];
      list.push(row.categoryId);
      catAssignments.set(row.productId, list);
    }
    const catIds = [...new Set(catRows.map((row) => row.categoryId))];
    if (catIds.length > 0) {
      const cats = await prisma.category.findMany({
        where: { tenantId, id: { in: catIds } },
        select: { id: true, name: true },
      });
      for (const cat of cats) categoryMap.set(cat.id, cat.name);
    }
  }

  const items: ProductListRow[] = rows.map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    status: row.status,
    productType: row.productType,
    visibility: row.visibility,
    createdAt: row.createdAt,
    brand: row.brandId && brandMap.has(row.brandId) ? { name: brandMap.get(row.brandId)! } : null,
    categories: (catAssignments.get(row.id) ?? [])
      .filter((categoryId) => categoryMap.has(categoryId))
      .map((categoryId) => ({ category: { name: categoryMap.get(categoryId)! } })),
  }));

  return { items, total, page, pageSize };
}

export async function getProductEditorPayload(tenantId: string, id: string): Promise<ProductEditorPayload | null> {
  const product = await prisma.product.findFirst({
    where: { tenantId, id, deletedAt: null },
    include: {
      collections: { select: { collection: { select: { id: true, name: true, slug: true } } } },
    },
  });
  if (!product) return null;

  const [variants, catRows, brand] = await Promise.all([
    prisma.productVariant.findMany({
      where: { tenantId, productId: id, deletedAt: null },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.productCategory.findMany({
      where: { tenantId, productId: id },
      select: { categoryId: true },
    }),
    product.brandId
      ? prisma.brand.findFirst({
          where: { tenantId, id: product.brandId, deletedAt: null },
          select: { id: true, name: true, slug: true },
        })
      : Promise.resolve(null),
  ]);

  const categoryIds = [...new Set(catRows.map((row) => row.categoryId))];
  const categories =
    categoryIds.length > 0
      ? await prisma.category.findMany({
          where: { tenantId, id: { in: categoryIds }, deletedAt: null },
          select: { id: true, name: true, slug: true },
        })
      : [];

  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    shortDescription: product.shortDescription,
    description: product.description,
    productType: product.productType,
    status: product.status,
    visibility: product.visibility,
    condition: product.condition,
    warrantyMonths: product.warrantyMonths,
    brandId: product.brandId,
    seoTitle: product.seoTitle,
    seoDescription: product.seoDescription,
    version: product.version,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
    publishAt: product.publishAt,
    unpublishAt: product.unpublishAt,
    variants: variants.map((v) => ({
      id: v.id,
      sku: v.sku,
      name: v.name,
      barcode: v.barcode,
      status: v.status,
      isDefault: v.isDefault,
      version: v.version,
      attributes: v.attributes,
    })),
    categories: categories.map((c) => ({ id: c.id, name: c.name, slug: c.slug })),
    collections: product.collections.map((c) => c.collection),
    brand,
  };
}

export async function createProduct(
  tenantId: string,
  actor: { id: string; email: string },
  input: ProductInput,
): Promise<{ id: string }> {
  const name = normalizeName(input.name);
  const slug = normalizeSlug(input.slug, name);

  const existing = await prisma.product.findUnique({
    where: { tenantId_slug: { tenantId, slug } },
  });
  if (existing) throw new ProductCrudError('Ya existe un producto con ese slug', 409);

  if (input.brandId) {
    const brand = await prisma.brand.findFirst({ where: { tenantId, id: input.brandId, deletedAt: null } });
    if (!brand) throw new ProductCrudError('Marca no encontrada', 400);
  }

  const product = await prisma.product.create({
    data: {
      tenantId,
      name,
      slug,
      shortDescription: toNullableString(input.shortDescription),
      description: toNullableString(input.description),
      productType: assertEnum(input.productType, PRODUCT_TYPES, 'productType'),
      status: assertEnum(input.status, PRODUCT_STATUSES, 'status'),
      visibility: assertEnum(input.visibility, PRODUCT_VISIBILITIES, 'visibility'),
      condition: assertEnum(input.condition, PRODUCT_CONDITIONS, 'condition'),
      warrantyMonths: toNullableInt(input.warrantyMonths),
      brandId: input.brandId ?? null,
      seoTitle: toNullableString(input.seoTitle),
      seoDescription: toNullableString(input.seoDescription),
    },
  });

  return { id: product.id };
}

export async function updateProduct(
  tenantId: string,
  actor: { id: string; email: string },
  id: string,
  input: ProductInput,
  expectedVersion: number,
): Promise<{ id: string; version: number }> {
  const current = await prisma.product.findFirst({ where: { tenantId, id, deletedAt: null } });
  if (!current) throw new ProductCrudError('Producto no encontrado', 404);
  if (current.version !== expectedVersion) throw new ProductCrudError('El producto fue modificado por otro usuario', 409);

  const name = normalizeName(input.name);
  const slug = normalizeSlug(input.slug, name);
  if (slug !== current.slug) {
    const duplicate = await prisma.product.findUnique({
      where: { tenantId_slug: { tenantId, slug } },
    });
    if (duplicate) throw new ProductCrudError('Ya existe un producto con ese slug', 409);
  }

  if (input.brandId) {
    const brand = await prisma.brand.findFirst({ where: { tenantId, id: input.brandId, deletedAt: null } });
    if (!brand) throw new ProductCrudError('Marca no encontrada', 400);
  }

  const updated = await prisma.product.update({
    where: { id },
    data: {
      name,
      slug,
      shortDescription: toNullableString(input.shortDescription),
      description: toNullableString(input.description),
      productType: assertEnum(input.productType, PRODUCT_TYPES, 'productType'),
      status: assertEnum(input.status, PRODUCT_STATUSES, 'status'),
      visibility: assertEnum(input.visibility, PRODUCT_VISIBILITIES, 'visibility'),
      condition: assertEnum(input.condition, PRODUCT_CONDITIONS, 'condition'),
      warrantyMonths: toNullableInt(input.warrantyMonths),
      brandId: input.brandId ?? null,
      seoTitle: toNullableString(input.seoTitle),
      seoDescription: toNullableString(input.seoDescription),
      version: { increment: 1 },
    },
  });

  return { id: updated.id, version: updated.version };
}

export async function createVariant(
  tenantId: string,
  actor: { id: string; email: string },
  productId: string,
  input: VariantInput,
): Promise<{ id: string }> {
  const product = await prisma.product.findFirst({ where: { tenantId, id: productId, deletedAt: null } });
  if (!product) throw new ProductCrudError('Producto no encontrado', 404);

  const sku = input.sku.trim();
  if (!sku) throw new ProductCrudError('El SKU es obligatorio', 400);

  const existing = await prisma.productVariant.findUnique({
    where: { tenantId_sku: { tenantId, sku } },
  });
  if (existing) throw new ProductCrudError('Ya existe una variante con ese SKU', 409);

  const defaultVariant = await prisma.productVariant.findFirst({
    where: { tenantId, productId, deletedAt: null, isDefault: true },
  });

  const variant = await prisma.productVariant.create({
    data: {
      tenantId,
      productId,
      sku,
      name: toNullableString(input.name),
      barcode: toNullableString(input.barcode),
      status: assertEnum(input.status, VARIANT_STATUSES, 'status'),
      isDefault: input.isDefault ?? !defaultVariant,
      attributes: normalizeVariantAttributes(input.attributes) as Prisma.InputJsonValue,
    },
  });

  return { id: variant.id };
}

export async function updateVariant(
  tenantId: string,
  actor: { id: string; email: string },
  productId: string,
  variantId: string,
  input: VariantInput,
  expectedVersion: number,
): Promise<{ id: string; version: number }> {
  const variant = await prisma.productVariant.findFirst({
    where: { tenantId, productId, id: variantId, deletedAt: null },
  });
  if (!variant) throw new ProductCrudError('Variante no encontrada', 404);
  if (variant.version !== expectedVersion) throw new ProductCrudError('La variante fue modificada por otro usuario', 409);

  const sku = input.sku.trim();
  if (!sku) throw new ProductCrudError('El SKU es obligatorio', 400);
  if (sku !== variant.sku) {
    const duplicate = await prisma.productVariant.findUnique({
      where: { tenantId_sku: { tenantId, sku } },
    });
    if (duplicate) throw new ProductCrudError('Ya existe una variante con ese SKU', 409);
  }

  const updated = await prisma.productVariant.update({
    where: { id: variantId },
    data: {
      sku,
      name: toNullableString(input.name),
      barcode: toNullableString(input.barcode),
      status: assertEnum(input.status, VARIANT_STATUSES, 'status'),
      isDefault: input.isDefault ?? variant.isDefault,
      attributes: normalizeVariantAttributes(input.attributes) as Prisma.InputJsonValue,
      version: { increment: 1 },
    },
  });

  return { id: updated.id, version: updated.version };
}

export async function deleteVariant(
  tenantId: string,
  actor: { id: string; email: string },
  productId: string,
  variantId: string,
): Promise<void> {
  const variant = await prisma.productVariant.findFirst({
    where: { tenantId, productId, id: variantId, deletedAt: null },
  });
  if (!variant) throw new ProductCrudError('Variante no encontrada', 404);

  await prisma.productVariant.update({
    where: { id: variantId },
    data: { deletedAt: new Date() },
  });
}

export async function setProductCategories(
  tenantId: string,
  actor: { id: string; email: string },
  productId: string,
  categoryIds: string[],
): Promise<void> {
  const product = await prisma.product.findFirst({ where: { tenantId, id: productId, deletedAt: null } });
  if (!product) throw new ProductCrudError('Producto no encontrado', 404);

  const ids = [...new Set(categoryIds)];
  const valid = await prisma.category.count({
    where: { tenantId, id: { in: ids }, deletedAt: null },
  });
  if (valid !== ids.length) throw new ProductCrudError('Una o más categorías no existen', 400);

  await prisma.$transaction([
    prisma.productCategory.deleteMany({ where: { tenantId, productId } }),
    ...ids.map((categoryId) =>
      prisma.productCategory.create({ data: { tenantId, productId, categoryId } }),
    ),
  ]);
}

export async function setProductCollections(
  tenantId: string,
  actor: { id: string; email: string },
  productId: string,
  collectionIds: string[],
): Promise<void> {
  const product = await prisma.product.findFirst({ where: { tenantId, id: productId, deletedAt: null } });
  if (!product) throw new ProductCrudError('Producto no encontrado', 404);

  const ids = [...new Set(collectionIds)];
  const valid = await prisma.collection.count({
    where: { tenantId, id: { in: ids }, deletedAt: null },
  });
  if (valid !== ids.length) throw new ProductCrudError('Una o más colecciones no existen', 400);

  await prisma.$transaction([
    prisma.productCollection.deleteMany({ where: { tenantId, productId } }),
    ...ids.map((collectionId, index) =>
      prisma.productCollection.create({
        data: { tenantId, productId, collectionId, displayOrder: index },
      }),
    ),
  ]);
}