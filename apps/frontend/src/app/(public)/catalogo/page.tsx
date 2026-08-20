import type { Metadata } from 'next';
import { getTenantId } from '@lib/auth/tenant';
import {
  listPublicBrands,
  listPublicCatalog,
  listPublicCategories,
} from '@lib/storefront/catalog';
import type { StorefrontSortValue } from '@lib/storefront/types';
import { CatalogPageClient } from './catalog-page-client';

export const metadata: Metadata = {
  title: 'Catálogo — Tienda | Seguridad Inteligente y Domótica',
  description: 'Explorá nuestro catálogo completo de cerraduras inteligentes, cámaras de seguridad, videoporteros, control de acceso, domótica y accesorios. Envíos a todo el país.',
  openGraph: {
    title: 'Catálogo — Tienda | Seguridad Inteligente y Domótica',
    description: 'Explorá nuestro catálogo completo de cerraduras inteligentes, cámaras de seguridad, videoporteros, control de acceso, domótica y accesorios.',
    url: '/catalogo',
    siteName: 'Tienda',
    images: [{ url: '/og-catalogo.jpg', width: 1200, height: 630 }],
    locale: 'es_AR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Catálogo — Tienda | Seguridad Inteligente y Domótica',
    description: 'Explorá nuestro catálogo completo de cerraduras inteligentes, cámaras de seguridad, videoporteros, control de acceso, domótica y accesorios.',
    images: ['/og-catalogo.jpg'],
  },
  alternates: {
    canonical: '/catalogo',
  },
};

const SORT_VALUES = new Set(['relevance', 'newest', 'price-asc', 'price-desc']);

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function toSort(value: string | undefined): StorefrontSortValue {
  return value && SORT_VALUES.has(value) ? (value as StorefrontSortValue) : 'relevance';
}

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function CatalogPage({ searchParams }: PageProps) {
  const tenantId = getTenantId();
  const sp = await searchParams;

  const q = first(sp['q']);
  const categoria = first(sp['categoria']);
  const brand = first(sp['brand']);
  const sort = toSort(first(sp['sort']));
  const rawPage = Number(first(sp['page']) ?? 1);
  const page = Number.isFinite(rawPage) && rawPage >= 1 ? Math.floor(rawPage) : 1;

  const [catalog, categories, brands] = await Promise.all([
    listPublicCatalog({
      tenantId,
      search: q,
      categorySlug: categoria,
      brandSlug: brand,
      sort,
      page,
    }),
    listPublicCategories(tenantId),
    listPublicBrands(tenantId),
  ]);

  return (
    <CatalogPageClient
      basePath="/catalogo"
      title="Catálogo"
      description="Explorá nuestro catálogo completo de productos para hogar y empresa."
      breadcrumbItems={[{ label: 'Inicio', href: '/' }, { label: 'Catálogo' }]}
      products={catalog.products}
      total={catalog.total}
      page={catalog.page}
      totalPages={catalog.totalPages}
      categories={categories}
      brands={brands}
      current={{ q, categoria, brand, sort }}
    />
  );
}