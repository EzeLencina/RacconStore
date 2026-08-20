import { CatalogProductCard } from '@components/catalog';
import type { StorefrontProduct } from '@lib/storefront/types';

type FeaturedGridProps = {
  items?: StorefrontProduct[];
  className?: string;
};

export function FeaturedGrid({ items, className }: FeaturedGridProps) {
  const products = items ?? [];

  if (products.length === 0) return null;

  return (
    <div
      className={
        className ??
        'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6'
      }
    >
      {products.map((product) => (
        <CatalogProductCard key={product.id} product={product} viewMode="grid" />
      ))}
    </div>
  );
}