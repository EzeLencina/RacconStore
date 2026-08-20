import { Prisma } from '@prisma/client';
import { prisma } from '@lib/auth/prisma';
import { isProductPublicable } from '@lib/products/lifecycle.types';
import { FEATURED_COLLECTION_SLUG } from '@lib/products/featured';
import { computeDisplayPrice, type VariantPriceLike } from './pricing';
import type {
  StorefrontBrand,
  StorefrontCategory,
  StorefrontPDPProduct,
  StorefrontProduct,
  StorefrontProductVariant,
  StorefrontSortValue,
} from './types';

export { computeDisplayPrice };

export const STOREFRONT_SORT_OPTIONS: { value: StorefrontSortValue; label: string }[] = [
  { value: 'relevance', label: 'Más relevantes' },
  { value: 'newest', label: 'Novedades' },
  { value: 'price-asc', label: 'Menor precio' },
  { value: 'price-desc', label: 'Mayor precio' },
];

export const STOREFRONT_PAGE_SIZE = 24;

export const STOREFRONT_MAX_ITEMS = 500;

export type StorefrontCatalogParams = {
  tenantId: string;
  search?: string;
  categorySlug?: string;
  brandSlug?: string;
  sort?: StorefrontSortValue;
  page?: number;
  pageSize?: number;
};

export type StorefrontCatalogResult = {
  products: StorefrontProduct[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

async function resolveDefaultPriceListId(tenantId: string): Promise<string | null> {
  const priceList = await prisma.priceList.findFirst({
    where: { tenantId, deletedAt: null },
    orderBy: [{ isDefault: 'desc' }, { priority: 'desc' }, { createdAt: 'asc' }],
    select: { id: true },
  });
  return priceList?.id ?? null;
}

async function getDefaultWarehouseId(tenantId: string): Promise<string | null> {
  const warehouse = await prisma.warehouse.findFirst({
    where: { tenantId, deletedAt: null },
    orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
    select: { id: true },
  });
  return warehouse?.id ?? null;
}

export async function listPublicCategories(tenantId: string): Promise<StorefrontCategory[]> {
  const rows = await prisma.category.findMany({
    where: { tenantId, deletedAt: null, status: 'ACTIVE', visibility: 'PUBLIC' },
    orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
    select: { id: true, name: true, slug: true, parentId: true },
  });

  const categoryIds = rows.map((c) => c.id);
  const assignments = categoryIds.length
    ? await prisma.productCategory.groupBy({
        by: ['categoryId'],
        where: { tenantId, categoryId: { in: categoryIds } },
        _count: { productId: true },
      })
    : [];
  const directCount = new Map(assignments.map((a) => [a.categoryId, a._count.productId]));

  const byId = new Map(rows.map((c) => [c.id, c]));
  const tree = new Map<string, StorefrontCategory>();

  for (const row of rows) {
    tree.set(row.id, {
      id: row.id,
      name: row.name,
      slug: row.slug,
      href: `/categoria/${row.slug}`,
      productCount: directCount.get(row.id) ?? 0,
    });
  }

  const roots: StorefrontCategory[] = [];
  for (const row of rows) {
    const node = tree.get(row.id)!;
    const parent = row.parentId ? tree.get(row.parentId) : undefined;
    if (parent) {
      parent.children ??= [];
      parent.children.push(node);
      parent.productCount += node.productCount;
    } else {
      roots.push(node);
    }
  }

  return roots;
}

export async function listPublicBrands(tenantId: string): Promise<StorefrontBrand[]> {
  const rows = await prisma.brand.findMany({
    where: { tenantId, deletedAt: null, status: 'ACTIVE', visibility: 'PUBLIC' },
    orderBy: [{ name: 'asc' }],
    select: { id: true, name: true, slug: true, logoUrl: true },
  });

  const brandIds = rows.map((b) => b.id);
  const counts = brandIds.length
    ? await prisma.product.groupBy({
        by: ['brandId'],
        where: { tenantId, brandId: { in: brandIds }, deletedAt: null, status: 'ACTIVE', visibility: 'PUBLIC' },
        _count: { id: true },
      })
    : [];
  const countByBrand = new Map(counts.map((c) => [c.brandId, c._count.id]));

  return rows.map((brand) => ({
    id: brand.id,
    name: brand.name,
    slug: brand.slug,
    href: `/catalogo?brand=${brand.slug}`,
    logoUrl: brand.logoUrl ?? undefined,
    productCount: countByBrand.get(brand.id) ?? 0,
  }));
}

export async function getPublicCategoryBySlug(
  tenantId: string,
  slug: string,
): Promise<{ id: string; name: string; slug: string; description?: string | null; seoTitle?: string | null; seoDescription?: string | null; descendantIds: string[] } | null> {
  const category = await prisma.category.findFirst({
    where: { tenantId, slug, deletedAt: null, status: 'ACTIVE', visibility: 'PUBLIC' },
  });
  if (!category) return null;

  const all = await prisma.category.findMany({
    where: { tenantId, deletedAt: null, status: 'ACTIVE', visibility: 'PUBLIC' },
    select: { id: true, parentId: true },
  });
  const childrenByParent = new Map<string, string[]>();
  for (const c of all) {
    if (c.parentId) {
      const list = childrenByParent.get(c.parentId) ?? [];
      list.push(c.id);
      childrenByParent.set(c.parentId, list);
    }
  }

  const descendantIds: string[] = [category.id];
  const queue = [category.id];
  while (queue.length > 0) {
    const current = queue.shift()!;
    for (const child of childrenByParent.get(current) ?? []) {
      descendantIds.push(child);
      queue.push(child);
    }
  }

  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    description: category.description,
    seoTitle: category.seoTitle,
    seoDescription: category.seoDescription,
    descendantIds,
  };
}

async function findProductIdsByCategories(
  tenantId: string,
  categoryIds: string[],
): Promise<Set<string> | null> {
  if (categoryIds.length === 0) return null;
  const rows = await prisma.productCategory.findMany({
    where: { tenantId, categoryId: { in: categoryIds } },
    select: { productId: true },
  });
  return new Set(rows.map((r) => r.productId));
}

async function findProductIdsByBrand(
  tenantId: string,
  brandSlug: string,
): Promise<Set<string> | null> {
  const brand = await prisma.brand.findFirst({
    where: { tenantId, slug: brandSlug, deletedAt: null, status: 'ACTIVE', visibility: 'PUBLIC' },
    select: { id: true },
  });
  if (!brand) return null;
  const rows = await prisma.product.findMany({
    where: { tenantId, brandId: brand.id, deletedAt: null },
    select: { id: true },
  });
  return new Set(rows.map((r) => r.id));
}

export async function enrichProductCards(
  tenantId: string,
  products: {
    id: string;
    name: string;
    slug: string;
    status: string;
    visibility: string;
    deletedAt: Date | null;
    publishAt: Date | null;
    unpublishAt: Date | null;
    createdAt: Date;
    warrantyMonths: number | null;
    brandId: string | null;
  }[],
): Promise<StorefrontProduct[]> {
  if (products.length === 0) return [];

  const now = new Date();
  const productIds = products.map((p) => p.id);

  const [variants, categories, summaries, brandRows] = await Promise.all([
    prisma.productVariant.findMany({
      where: { tenantId, productId: { in: productIds }, deletedAt: null, status: 'ACTIVE' },
      orderBy: [{ productId: 'asc' }, { isDefault: 'desc' }, { createdAt: 'asc' }],
      select: {
        id: true,
        productId: true,
        sku: true,
        name: true,
        attributes: true,
      },
    }),
    prisma.productCategory.findMany({
      where: { tenantId, productId: { in: productIds } },
      select: { productId: true, categoryId: true },
    }),
    prisma.productReviewSummary.findMany({
      where: { tenantId, productId: { in: productIds } },
      select: { productId: true, averageRating: true, totalReviews: true },
    }),
    prisma.brand.findMany({
      where: { tenantId, id: { in: products.map((p) => p.brandId ?? '').filter(Boolean) } },
      select: { id: true, name: true, slug: true },
    }),
  ]);

  const categoriesById = await prisma.category.findMany({
    where: { tenantId, id: { in: categories.map((c) => c.categoryId) } },
    select: { id: true, name: true, slug: true, parentId: true },
  });

  const priceListId = await resolveDefaultPriceListId(tenantId);
  const warehouseId = await getDefaultWarehouseId(tenantId);

  const variantIds = variants.map((v) => v.id);
  const [prices, inventory] = await Promise.all([
    priceListId && variantIds.length
      ? prisma.variantPrice.findMany({
          where: { tenantId, priceListId, productVariantId: { in: variantIds }, deletedAt: null },
          select: {
            productVariantId: true,
            listAmount: true,
            saleAmount: true,
            promotionalAmount: true,
            promotionalStartsAt: true,
            promotionalEndsAt: true,
          },
        })
      : Promise.resolve([]),
    warehouseId && variantIds.length
      ? prisma.inventoryItem.findMany({
          where: { tenantId, warehouseId, productVariantId: { in: variantIds } },
          select: { productVariantId: true, onHand: true, reserved: true },
        })
      : Promise.resolve([]),
  ]);

  const variantsByProduct = new Map<string, typeof variants>();
  for (const variant of variants) {
    const list = variantsByProduct.get(variant.productId) ?? [];
    list.push(variant);
    variantsByProduct.set(variant.productId, list);
  }

  const priceByVariant = new Map(prices.map((p) => [p.productVariantId, p]));
  const stockByVariant = new Map<string, number>();
  for (const item of inventory) {
    stockByVariant.set(item.productVariantId, Math.max(0, item.onHand - item.reserved));
  }

  const categoryById = new Map(categoriesById.map((c) => [c.id, c]));
  const categoriesByProduct = new Map<string, { id: string; name: string; slug: string; parentId: string | null }[]>();
  for (const row of categories) {
    const cat = categoryById.get(row.categoryId);
    if (!cat) continue;
    const list = categoriesByProduct.get(row.productId) ?? [];
    list.push(cat);
    categoriesByProduct.set(row.productId, list);
  }

  const summaryByProduct = new Map(summaries.map((s) => [s.productId, s]));
  const brandById = new Map(brandRows.map((b) => [b.id, b]));

  const cards: StorefrontProduct[] = [];

  for (const product of products) {
    if (!isProductPublicable(product, now)) continue;

    const productVariants = variantsByProduct.get(product.id) ?? [];
    const defaultVariant = productVariants[0];
    const price = defaultVariant ? priceByVariant.get(defaultVariant.id) : undefined;
    const displayPrice = computeDisplayPrice(price, now);

    const stock = defaultVariant ? (stockByVariant.get(defaultVariant.id) ?? 0) : 0;
    const inStock = stock > 0;

    const productCategories = categoriesByProduct.get(product.id) ?? [];
    const categoryName = productCategories[0]?.name ?? '';
    const categorySlug = productCategories[0]?.slug ?? '';
    const subcategory = productCategories[0]?.parentId
      ? categoryById.get(productCategories[0].parentId)?.name ?? ''
      : '';
    const subcategorySlug = productCategories[0]?.parentId
      ? categoryById.get(productCategories[0].parentId)?.slug ?? ''
      : '';

    const brand = product.brandId ? brandById.get(product.brandId) : undefined;
    const summary = summaryByProduct.get(product.id);
    const isNew = now.getTime() - new Date(product.createdAt).getTime() < 30 * 24 * 60 * 60 * 1000;

    const badge =
      displayPrice.discount !== undefined
        ? { text: `${displayPrice.discount}% OFF`, variant: 'danger' as const }
        : isNew
          ? { text: 'Nuevo', variant: 'info' as const }
          : undefined;

    cards.push({
      id: product.id,
      name: product.name,
      slug: product.slug,
      sku: defaultVariant?.sku ?? '',
      brand: brand?.name ?? '',
      brandSlug: brand?.slug ?? '',
      category: categoryName,
      categorySlug,
      subcategory,
      subcategorySlug,
      price: displayPrice.price,
      originalPrice: displayPrice.originalPrice,
      discount: displayPrice.discount,
      rating: summary ? Number(summary.averageRating) : 0,
      reviewCount: summary?.totalReviews ?? 0,
      image: '',
      images: [],
      badge: badge?.text,
      badgeVariant: badge?.variant,
      inStock,
      stockCount: stock,
      isNew,
      isFeatured: false,
      estimatedDelivery: '',
      warranty: product.warrantyMonths ? `${product.warrantyMonths} meses` : '',
      specs: {},
    });
  }

  return cards;
}

export async function listPublicCatalog(params: StorefrontCatalogParams): Promise<StorefrontCatalogResult> {
  const {
    tenantId,
    search,
    categorySlug,
    brandSlug,
    sort = 'relevance',
    page = 1,
    pageSize = STOREFRONT_PAGE_SIZE,
  } = params;

  const q = search?.trim();
  const where: Prisma.ProductWhereInput = {
    tenantId,
    deletedAt: null,
    visibility: 'PUBLIC',
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { slug: { contains: q, mode: 'insensitive' } },
          ],
        }
      : {}),
  };

  const byCategory = categorySlug
    ? await getPublicCategoryBySlug(tenantId, categorySlug)
    : null;
  const categoryIds = byCategory ? await findProductIdsByCategories(tenantId, byCategory.descendantIds) : null;
  if (categorySlug && (!byCategory || !categoryIds)) {
    return { products: [], total: 0, page, pageSize, totalPages: 0 };
  }

  const byBrand = brandSlug ? await findProductIdsByBrand(tenantId, brandSlug) : null;
  if (brandSlug && !byBrand) {
    return { products: [], total: 0, page, pageSize, totalPages: 0 };
  }

  let ids: Set<string> | null = null;
  if (categoryIds) ids = categoryIds;
  if (byBrand) {
    ids = ids ? new Set([...ids].filter((id) => byBrand.has(id))) : byBrand;
  }
  if (ids) where.id = { in: [...ids] };

  const products = await prisma.product.findMany({
    where,
    orderBy: [{ createdAt: 'desc' }],
    take: STOREFRONT_MAX_ITEMS,
    select: {
      id: true,
      name: true,
      slug: true,
      status: true,
      visibility: true,
      deletedAt: true,
      publishAt: true,
      unpublishAt: true,
      createdAt: true,
      warrantyMonths: true,
      brandId: true,
    },
  });

  const cards = await enrichProductCards(tenantId, products);
  const sorted = sortCards(cards, sort);
  const total = sorted.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const slice = sorted.slice((safePage - 1) * pageSize, safePage * pageSize);

  return {
    products: slice,
    total,
    page: safePage,
    pageSize,
    totalPages,
  };
}

function sortCards(cards: StorefrontProduct[], sort: StorefrontSortValue): StorefrontProduct[] {
  const sorted = [...cards];
  switch (sort) {
    case 'price-asc':
      sorted.sort((a, b) => a.price - b.price);
      break;
    case 'price-desc':
      sorted.sort((a, b) => b.price - a.price);
      break;
    case 'newest':
      break;
    case 'relevance':
      break;
  }
  return sorted;
}

export async function listPromotedProducts(
  tenantId: string,
  limit = 4,
): Promise<StorefrontProduct[]> {
  const products = await prisma.product.findMany({
    where: { tenantId, deletedAt: null, visibility: 'PUBLIC' },
    orderBy: [{ createdAt: 'desc' }],
    take: STOREFRONT_MAX_ITEMS,
    select: {
      id: true,
      name: true,
      slug: true,
      status: true,
      visibility: true,
      deletedAt: true,
      publishAt: true,
      unpublishAt: true,
      createdAt: true,
      warrantyMonths: true,
      brandId: true,
    },
  });

  const cards = await enrichProductCards(tenantId, products);
  return cards.filter((card) => card.discount !== undefined).slice(0, limit);
}

export async function listFeaturedStorefrontProducts(
  tenantId: string,
  limit = 4,
): Promise<StorefrontProduct[]> {
  const collection = await prisma.collection.findFirst({
    where: { tenantId, slug: FEATURED_COLLECTION_SLUG },
  });
  if (!collection) return [];

  const rows = await prisma.productCollection.findMany({
    where: { tenantId, collectionId: collection.id },
    include: { product: true },
    orderBy: { displayOrder: 'asc' },
  });

  const publicRows = rows
    .filter((row) => isProductPublicable(row.product))
    .slice(0, STOREFRONT_MAX_ITEMS);

  const cards = await enrichProductCards(tenantId, publicRows.map((r) => r.product));
  return cards.slice(0, limit);
}

export async function getPublicProductBySlug(
  tenantId: string,
  slug: string,
): Promise<StorefrontPDPProduct | null> {
  const product = await prisma.product.findFirst({
    where: { tenantId, slug, deletedAt: null, visibility: 'PUBLIC' },
  });
  if (!product || !isProductPublicable(product)) return null;

  const now = new Date();

  const [variants, productCategories, summary, brand] = await Promise.all([
    prisma.productVariant.findMany({
      where: { tenantId, productId: product.id, deletedAt: null },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
      select: {
        id: true,
        sku: true,
        name: true,
        status: true,
        attributes: true,
      },
    }),
    prisma.productCategory.findMany({
      where: { tenantId, productId: product.id },
      select: { categoryId: true },
    }),
    prisma.productReviewSummary.findUnique({
      where: { tenantId_productId: { tenantId, productId: product.id } },
      select: { averageRating: true, totalReviews: true },
    }),
    product.brandId
      ? prisma.brand.findFirst({ where: { tenantId, id: product.brandId } })
      : Promise.resolve(null),
  ]);

  const categories = productCategories.length
    ? await prisma.category.findMany({
        where: { tenantId, id: { in: productCategories.map((c) => c.categoryId) } },
        select: { id: true, name: true, slug: true, parentId: true, description: true },
      })
    : [];
  const primary = categories[0];
  const parent = primary?.parentId ? categories.find((c) => c.id === primary.parentId) : undefined;

  const priceListId = await resolveDefaultPriceListId(tenantId);
  const warehouseId = await getDefaultWarehouseId(tenantId);

  const defaultVariant = variants.find((v) => v.status === 'ACTIVE') ?? variants[0];
  let price = computeDisplayPrice(null, now);
  let stock = 0;
  let variantAttributes: Record<string, string> = {};

  if (defaultVariant) {
    const [variantPrice, inventoryItems] = await Promise.all([
      priceListId
        ? prisma.variantPrice.findFirst({
            where: { tenantId, priceListId, productVariantId: defaultVariant.id, deletedAt: null },
          })
        : Promise.resolve(null),
      warehouseId
        ? prisma.inventoryItem.findMany({
            where: { tenantId, warehouseId, productVariantId: defaultVariant.id },
            select: { onHand: true, reserved: true },
          })
        : Promise.resolve([]),
    ]);
    price = computeDisplayPrice(variantPrice, now);
    stock = inventoryItems.reduce((sum, item) => sum + Math.max(0, item.onHand - item.reserved), 0);

    const attributes = Array.isArray(defaultVariant.attributes)
      ? (defaultVariant.attributes as { key?: string; value?: string | number | boolean }[])
      : [];
    for (const attr of attributes) {
      const key = String(attr.key ?? '').trim();
      if (key) variantAttributes[key] = String(attr.value ?? '');
    }
  }

  const inStock = stock > 0;
  const isNew = now.getTime() - new Date(product.createdAt).getTime() < 30 * 24 * 60 * 60 * 1000;
  const discount = price.discount;
  const badge =
    discount !== undefined
      ? { text: `${discount}% OFF`, variant: 'danger' as const }
      : isNew
        ? { text: 'Nuevo', variant: 'info' as const }
        : undefined;

  const variantOptions: StorefrontProductVariant[] = variants.map((variant) => ({
    id: variant.id,
    type: 'version',
    label: 'Versión',
    value: variant.name ?? variant.sku,
    available: variant.status === 'ACTIVE',
  }));

  const specs: Record<string, string> = {
    ...(brand ? { Marca: brand.name } : {}),
    ...(defaultVariant?.name ? { Modelo: defaultVariant.name } : {}),
    ...(defaultVariant ? { SKU: defaultVariant.sku } : {}),
    ...(product.warrantyMonths ? { Garantía: `${product.warrantyMonths} meses` } : {}),
    ...variantAttributes,
  };

  const rating = summary ? Number(summary.averageRating) : 0;

  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    sku: defaultVariant?.sku ?? '',
    brand: brand?.name ?? '',
    brandSlug: brand?.slug ?? '',
    model: defaultVariant?.name ?? '',
    internalCode: defaultVariant?.sku ?? '',
    category: primary?.name ?? '',
    categorySlug: primary?.slug ?? '',
    subcategory: parent?.name ?? '',
    subcategorySlug: parent?.slug ?? '',
    price: price.price,
    originalPrice: price.originalPrice,
    discount: price.discount,
    savings: price.originalPrice !== undefined ? price.originalPrice - price.price : undefined,
    installments:
      price.price > 0
        ? [
            {
              count: 12,
              interest: false,
              installmentPrice: Math.ceil(price.price / 12),
            },
          ]
        : [],
    images: [],
    videos: [],
    status: product.status === 'ACTIVE' ? 'active' : product.status === 'DRAFT' ? 'draft' : 'discontinued',
    inStock,
    stockCount: stock,
    isNew,
    isFeatured: false,
    badge: badge?.text,
    badgeVariant: badge?.variant,
    estimatedDelivery: '',
    shipping: [],
    warranty: product.warrantyMonths ? `${product.warrantyMonths} meses` : '',
    variants: variantOptions,
    shortDescription: product.shortDescription ?? '',
    description: product.description ?? '',
    features: [],
    benefits: [],
    boxContents: [],
    installation: '',
    documentation: [],
    specs,
    rating,
    reviewCount: summary?.totalReviews ?? 0,
    reviews: [],
    questions: [],
    relatedSlugs: [],
    crossSellSlugs: [],
  };
}