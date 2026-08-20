'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Container } from '@components/layout/containers/container';
import { CatalogBreadcrumb } from '@components/catalog';
import { CatalogToolbar } from '@components/catalog';
import { CatalogSidebar } from '@components/catalog';
import { ProductGrid } from '@components/catalog';
import { CatalogPagination } from '@components/catalog';
import { CatalogEmptyState } from '@components/catalog';
import { cn } from '@lib/helpers/cn';
import type {
  StorefrontBrand,
  StorefrontCategory,
  StorefrontProduct,
  StorefrontSortValue,
} from '@lib/storefront/types';
import { STOREFRONT_SORT_OPTIONS } from '@lib/storefront/catalog';

type CatalogCurrent = {
  q?: string;
  categoria?: string;
  brand?: string;
  sort?: StorefrontSortValue;
};

type CatalogPageClientProps = {
  basePath: string;
  title: string;
  description?: string;
  breadcrumbItems?: { label: string; href?: string }[];
  products: StorefrontProduct[];
  total: number;
  page: number;
  totalPages: number;
  categories: StorefrontCategory[];
  brands: StorefrontBrand[];
  current: CatalogCurrent;
};

export function CatalogPageClient({
  basePath,
  title,
  description,
  breadcrumbItems,
  products,
  total,
  page,
  totalPages,
  categories,
  brands,
  current,
}: CatalogPageClientProps) {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const buildUrl = (patch: Record<string, string | undefined>): string => {
    const params = new URLSearchParams();
    const merged = { ...current, ...patch };
    const entries: [string, string][] = [];
    if (merged.q) entries.push(['q', merged.q]);
    if (merged.categoria) entries.push(['categoria', merged.categoria]);
    if (merged.brand) entries.push(['brand', merged.brand]);
    if (merged.sort && merged.sort !== 'relevance') entries.push(['sort', merged.sort]);
    if (patch['page']) entries.push(['page', patch['page']]);
    for (const [key, value] of entries) params.set(key, value);
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };

  const sortValue: StorefrontSortValue = current.sort ?? 'relevance';
  const clearHref = basePath;

  const categoryName = current.categoria
    ? findCategoryName(categories, current.categoria)
    : undefined;
  const brandName = current.brand ? brands.find((b) => b.slug === current.brand)?.name : undefined;

  const activeFilters: { id: string; label: string; removeHref: string }[] = [];
  if (current.categoria && categoryName) {
    activeFilters.push({
      id: `cat-${current.categoria}`,
      label: categoryName,
      removeHref: buildUrl({ categoria: undefined }),
    });
  }
  if (current.brand && brandName) {
    activeFilters.push({
      id: `brand-${current.brand}`,
      label: brandName,
      removeHref: buildUrl({ brand: undefined }),
    });
  }
  if (current.q) {
    activeFilters.push({
      id: 'q',
      label: `Búsqueda: "${current.q}"`,
      removeHref: buildUrl({ q: undefined }),
    });
  }

  const handleSearch = (q: string) => {
    router.push(buildUrl({ q: q || undefined, page: undefined }));
  };

  const handleSortChange = (value: StorefrontSortValue) => {
    router.push(buildUrl({ sort: value, page: undefined }));
  };

  const handleViewModeChange = (mode: 'grid' | 'list') => {
    setViewMode(mode);
  };

  return (
    <Container size="xl" className="py-6 sm:py-8">
      {breadcrumbItems && <CatalogBreadcrumb items={breadcrumbItems} />}

      {description && (
        <p className="text-sm text-muted-foreground mb-4 max-w-3xl">{description}</p>
      )}

      <CatalogToolbar
        title={title}
        totalProducts={total}
        searchQuery={current.q}
        viewMode={viewMode}
        sortValue={sortValue}
        sortOptions={STOREFRONT_SORT_OPTIONS}
        activeFilters={activeFilters}
        clearHref={clearHref}
        onViewModeChange={handleViewModeChange}
        onToggleFilters={() => setMobileFiltersOpen(true)}
        onSearch={handleSearch}
        onSortChange={handleSortChange}
      />

      <div className="mt-4 lg:mt-6 flex gap-6">
        <CatalogSidebar
          categories={categories}
          brands={brands}
          currentCategoria={current.categoria}
          currentBrand={current.brand}
          clearHref={clearHref}
          isMobileOpen={mobileFiltersOpen}
          onMobileClose={() => setMobileFiltersOpen(false)}
        />

        <div className="flex-1 min-w-0">
          {products.length > 0 ? (
            <>
              <ProductGrid products={products} viewMode={viewMode} />
              <CatalogPagination currentPage={page} totalPages={totalPages} buildHref={(p) => buildUrl({ page: String(p) })} />
            </>
          ) : (
            <div className={cn('rounded-xl border border-border bg-background', mobileFiltersOpen && 'hidden lg:block')}>
              <CatalogEmptyState
                variant={total === 0 ? 'no-results' : 'no-products'}
                ctaHref={clearHref}
              />
            </div>
          )}
        </div>
      </div>
    </Container>
  );
}

function findCategoryName(categories: StorefrontCategory[], slug: string): string | undefined {
  for (const category of categories) {
    if (category.slug === slug) return category.name;
    const child = category.children?.find((c) => c.slug === slug);
    if (child) return child.name;
  }
  return undefined;
}