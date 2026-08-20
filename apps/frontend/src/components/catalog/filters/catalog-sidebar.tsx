'use client';

import { useState } from 'react';
import { X, ChevronDown, Minus, Plus } from 'lucide-react';
import { cn } from '@lib/helpers/cn';
import { Button } from '@tienda/ui';
import type { StorefrontBrand, StorefrontCategory } from '@lib/storefront/types';

type CatalogSidebarProps = {
  categories: StorefrontCategory[];
  brands: StorefrontBrand[];
  currentCategoria?: string;
  currentBrand?: string;
  clearHref: string;
  className?: string;
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
};

function CategoryTree({
  categories,
  activeSlug,
}: {
  categories: StorefrontCategory[];
  activeSlug?: string;
}) {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="space-y-1">
      {categories.map((cat) => {
        const hasChildren = (cat.children?.length ?? 0) > 0;
        const isExpanded = expanded === cat.id || activeSlug === cat.slug;
        const isActive = activeSlug === cat.slug;

        return (
          <div key={cat.id}>
            <div className="flex items-center">
              <a
                href={cat.href}
                className={cn(
                  'flex-1 rounded-md px-2 py-1.5 text-sm transition-colors',
                  isActive ? 'font-medium text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-accent',
                )}
              >
                {cat.name}
              </a>
              {hasChildren && (
                <button
                  type="button"
                  onClick={() => setExpanded(isExpanded ? null : cat.id)}
                  className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                  aria-label={isExpanded ? `Contraer ${cat.name}` : `Expandir ${cat.name}`}
                >
                  {isExpanded ? <Minus className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                </button>
              )}
            </div>

            {isExpanded && hasChildren && (
              <div className="ml-3 mt-1 space-y-1 border-l border-border pl-2">
                {cat.children?.map((child) => (
                  <a
                    key={child.id}
                    href={child.href}
                    className={cn(
                      'block rounded-md px-2 py-1 text-sm transition-colors',
                      activeSlug === child.slug
                        ? 'font-medium text-primary'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent',
                    )}
                  >
                    {child.name}
                    {child.productCount > 0 && (
                      <span className="ml-1 text-xs text-muted-foreground/70">({child.productCount})</span>
                    )}
                  </a>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function BrandList({ brands, activeSlug }: { brands: StorefrontBrand[]; activeSlug?: string }) {
  if (brands.length === 0) {
    return <p className="px-2 py-1.5 text-sm text-muted-foreground">Sin marcas disponibles</p>;
  }

  return (
    <div className="space-y-1">
      {brands.map((brand) => (
        <a
          key={brand.id}
          href={brand.href}
          className={cn(
            'flex items-center justify-between rounded-md px-2 py-1.5 text-sm transition-colors',
            activeSlug === brand.slug
              ? 'font-medium text-primary'
              : 'text-muted-foreground hover:text-foreground hover:bg-accent',
          )}
        >
          <span>{brand.name}</span>
          {brand.productCount > 0 && (
            <span className="text-xs text-muted-foreground/70">({brand.productCount})</span>
          )}
        </a>
      ))}
    </div>
  );
}

export function CatalogSidebar({
  categories,
  brands,
  currentCategoria,
  currentBrand,
  clearHref,
  className,
  isMobileOpen,
  onMobileClose,
}: CatalogSidebarProps) {
  return (
    <>
      {isMobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={onMobileClose} aria-hidden="true" />
      )}

      <aside
        className={cn(
          'w-full lg:w-64 shrink-0',
          'fixed lg:sticky top-0 lg:top-24 left-0 z-50 lg:z-0',
          'h-full lg:h-auto',
          'bg-background lg:bg-transparent',
          'overflow-y-auto lg:overflow-visible',
          'transform transition-transform duration-300 lg:transform-none',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
          className,
        )}
        aria-label="Product filters"
      >
        <div className="flex items-center justify-between p-4 lg:p-0 lg:mb-4 border-b lg:border-b-0 border-border">
          <span className="text-sm font-semibold">Filtros</span>
          <button
            type="button"
            onClick={onMobileClose}
            className="lg:hidden rounded-lg p-2 hover:bg-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Close filters"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-4 lg:px-0 space-y-6">
          <div>
            <h3 className="flex items-center gap-1 text-sm font-semibold text-foreground px-2 py-2">
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              Categorías
            </h3>
            <CategoryTree categories={categories} activeSlug={currentCategoria} />
          </div>

          <div>
            <h3 className="flex items-center gap-1 text-sm font-semibold text-foreground px-2 py-2">
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              Marcas
            </h3>
            <BrandList brands={brands} activeSlug={currentBrand} />
          </div>
        </div>

        <div className="p-4 lg:p-0 lg:pt-4 space-y-2 lg:sticky lg:bottom-0 lg:bg-background">
          <Button size="sm" variant="outline" fullWidth asChild>
            <a href={clearHref}>Limpiar filtros</a>
          </Button>
          <Button size="sm" fullWidth className="lg:hidden" onClick={onMobileClose}>
            Ver resultados
          </Button>
        </div>
      </aside>
    </>
  );
}