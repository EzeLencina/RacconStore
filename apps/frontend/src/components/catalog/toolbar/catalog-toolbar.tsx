'use client';

import { useState } from 'react';
import { SlidersHorizontal, LayoutGrid, List, Search } from 'lucide-react';
import { cn } from '@lib/helpers/cn';
import { CatalogSorting } from '../sorting/catalog-sorting';
import { ActiveFilters } from '../active-filters/active-filters';
import type { StorefrontSortOption, StorefrontSortValue } from '@lib/storefront/types';

export type ActiveFilterChip = {
  id: string;
  label: string;
  removeHref: string;
};

type CatalogToolbarProps = {
  title: string;
  totalProducts: number;
  searchQuery?: string;
  viewMode: 'grid' | 'list';
  sortValue: StorefrontSortValue;
  sortOptions: StorefrontSortOption[];
  activeFilters: ActiveFilterChip[];
  clearHref: string;
  onViewModeChange: (mode: 'grid' | 'list') => void;
  onToggleFilters: () => void;
  onSearch: (q: string) => void;
  onSortChange: (value: StorefrontSortValue) => void;
  className?: string;
};

export function CatalogToolbar({
  title,
  totalProducts,
  searchQuery,
  viewMode,
  sortValue,
  sortOptions,
  activeFilters,
  clearHref,
  onViewModeChange,
  onToggleFilters,
  onSearch,
  onSortChange,
  className,
}: CatalogToolbarProps) {
  const [query, setQuery] = useState(searchQuery ?? '');

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onToggleFilters}
            className="inline-flex lg:hidden items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Toggle filters"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filtros
          </button>

          <div>
            <h1 className="text-lg sm:text-xl font-bold tracking-tight">{title}</h1>
            <p className="text-sm text-muted-foreground">
              {totalProducts} producto{totalProducts !== 1 ? 's' : ''} encontrados
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <CatalogSorting options={sortOptions} value={sortValue} onSortChange={onSortChange} />

          <div className="hidden sm:flex items-center rounded-lg border border-border">
            <button
              type="button"
              onClick={() => onViewModeChange('grid')}
              className={cn(
                'rounded-l-lg p-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                viewMode === 'grid' ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:text-foreground',
              )}
              aria-label="Grid view"
              aria-pressed={viewMode === 'grid'}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange('list')}
              className={cn(
                'rounded-r-lg p-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                viewMode === 'list' ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:text-foreground',
              )}
              aria-label="List view"
              aria-pressed={viewMode === 'list'}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <form
        className="flex items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          onSearch(query.trim());
        }}
        role="search"
      >
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            key={searchQuery ?? ''}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar en el catálogo..."
            className="w-full rounded-lg border border-input bg-background py-2 pl-9 pr-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Buscar productos"
          />
        </div>
        <button
          type="submit"
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Buscar
        </button>
      </form>

      <ActiveFilters filters={activeFilters} clearHref={clearHref} />
    </div>
  );
}