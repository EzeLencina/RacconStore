import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTenantId } from '@lib/auth/tenant';
import {
  getPublicCategoryBySlug,
  listPublicBrands,
  listPublicCatalog,
  listPublicCategories,
} from '@lib/storefront/catalog';
import { buildCategoryMetadata } from '@lib/seo';
import type { StorefrontSortValue } from '@lib/storefront/types';
import { CatalogPageClient } from '../../catalogo/catalog-page-client';

const SORT_VALUES = new Set(['relevance', 'newest', 'price-asc', 'price-desc']);

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function toSort(value: string | undefined): StorefrontSortValue {
  return value && SORT_VALUES.has(value) ? (value as StorefrontSortValue) : 'relevance';
}

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = await getPublicCategoryBySlug(getTenantId(), slug);
  if (!category) return { title: 'Categoría no encontrada | Tienda' };
  return buildCategoryMetadata(
    category.name,
    category.description ?? category.seoDescription ?? '',
    category.slug,
  );
}

export default async function CategoryPage({ params, searchParams }: PageProps) {
  const tenantId = getTenantId();
  const { slug } = await params;
  const sp = await searchParams;

  const category = await getPublicCategoryBySlug(tenantId, slug);
  if (!category) notFound();

  const q = first(sp['q']);
  const brand = first(sp['brand']);
  const sort = toSort(first(sp['sort']));
  const rawPage = Number(first(sp['page']) ?? 1);
  const page = Number.isFinite(rawPage) && rawPage >= 1 ? Math.floor(rawPage) : 1;

  const [catalog, categories, brands] = await Promise.all([
    listPublicCatalog({
      tenantId,
      search: q,
      categorySlug: slug,
      brandSlug: brand,
      sort,
      page,
    }),
    listPublicCategories(tenantId),
    listPublicBrands(tenantId),
  ]);

  return (
    <CatalogPageClient
      basePath={`/categoria/${slug}`}
      title={category.name}
      description={category.description ?? category.seoDescription ?? undefined}
      breadcrumbItems={[
        { label: 'Inicio', href: '/' },
        { label: 'Catálogo', href: '/catalogo' },
        { label: category.name },
      ]}
      products={catalog.products}
      total={catalog.total}
      page={catalog.page}
      totalPages={catalog.totalPages}
      categories={categories}
      brands={brands}
      current={{ q, categoria: slug, brand, sort }}
    />
  );
}