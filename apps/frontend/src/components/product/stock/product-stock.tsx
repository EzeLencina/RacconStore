import { cn } from '@lib/helpers/cn';
import type { PDPProduct } from '@lib/storefront/types';

type ProductStockProps = {
  product: PDPProduct;
  className?: string;
};

export function ProductStock({ product, className }: ProductStockProps) {
  const lowStock = product.inStock && product.stockCount <= 5;

  return (
    <div className={cn('flex items-center gap-2 text-sm', className)}>
      <span
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold',
          product.inStock
            ? lowStock
              ? 'bg-warning/10 text-warning'
              : 'bg-success/10 text-success'
            : 'bg-destructive/10 text-destructive',
        )}
        aria-live="polite"
      >
        <span
          className={cn(
            'h-1.5 w-1.5 rounded-full',
            product.inStock
              ? lowStock
                ? 'bg-warning'
                : 'bg-success'
              : 'bg-destructive',
          )}
          aria-hidden="true"
        />
        {product.inStock
          ? lowStock
            ? `Solo ${product.stockCount} restantes`
            : 'En stock'
          : 'Sin stock'}
      </span>

      {product.inStock && (
        <span className="text-xs text-muted-foreground">
          ({product.stockCount} disponibles)
        </span>
      )}
    </div>
  );
}
