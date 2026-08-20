'use client';

import { Heart, ArrowLeftRight, Eye, ShoppingCart, Truck } from 'lucide-react';
import { cn } from '@lib/helpers/cn';
import { formatPrice } from '@tienda/ui';
import { Badge, Rating, Button } from '@tienda/ui';
import type { CatalogProduct } from '@lib/catalog/mock-data';

type CatalogProductCardProps = {
  product: CatalogProduct;
  viewMode?: 'grid' | 'list';
  className?: string;
};

export function CatalogProductCard({ product, viewMode = 'grid', className }: CatalogProductCardProps) {
  const isGrid = viewMode === 'grid';

  return (
    <article
      className={cn(
        'group relative rounded-xl border border-border bg-background overflow-hidden transition-all duration-200 hover:shadow-md',
        isGrid ? 'flex flex-col' : 'flex flex-row',
        className,
      )}
    >
      <div className={cn('relative shrink-0', isGrid ? 'w-full aspect-square' : 'w-36 sm:w-48 md:w-56')}>
        <div className="h-full w-full bg-muted flex items-center justify-center p-4 sm:p-6">
          <div className="h-full w-full rounded-lg bg-muted-foreground/10" />
        </div>

        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {product.badge && (
            <Badge variant={product.badgeVariant ?? 'default'} size="sm">
              {product.badge}
            </Badge>
          )}
          {product.isNew && !product.badge && (
            <Badge variant="info" size="sm">Nuevo</Badge>
          )}
        </div>

        <div className={cn(
          'absolute top-2 right-2 flex flex-col gap-1',
          isGrid ? 'opacity-0 group-hover:opacity-100' : 'opacity-100',
          'transition-opacity duration-200',
        )}>
          <button type="button" className="rounded-lg bg-background/90 p-1.5 shadow-sm hover:bg-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label="Add to favorites">
            <Heart className="h-3.5 w-3.5" />
          </button>
          <button type="button" className="rounded-lg bg-background/90 p-1.5 shadow-sm hover:bg-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label="Compare product">
            <ArrowLeftRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className={cn('flex flex-col flex-1', isGrid ? 'p-3 sm:p-4' : 'p-3 sm:p-4 justify-center')}>
        <p className="text-xs text-muted-foreground mb-0.5">{product.brand}</p>

        <a href={`/producto/${product.slug}`} className="block">
          <h3 className={cn('font-medium text-foreground hover:text-primary transition-colors line-clamp-2', isGrid ? 'text-sm' : 'text-sm sm:text-base')}>
            {product.name}
          </h3>
        </a>

        {!isGrid && (
          <p className="text-xs text-muted-foreground mt-0.5">SKU: {product.sku}</p>
        )}

        {product.price > 0 && (
          <div className={cn('flex items-baseline gap-2', isGrid ? 'mt-1.5' : 'mt-1')}>
            <span className={cn('font-bold text-foreground', isGrid ? 'text-base' : 'text-lg')}>
              {formatPrice(product.price)}
            </span>
            {product.originalPrice && (
              <span className="text-xs text-muted-foreground line-through">{formatPrice(product.originalPrice)}</span>
            )}
          </div>
        )}

        {product.price > 0 && (
          <div className="flex items-center gap-2 mt-0.5">
            <Rating value={product.rating} size="sm" />
            <span className="text-xs text-muted-foreground">({product.reviewCount})</span>
          </div>
        )}

        <div className="flex items-center gap-2 mt-1">
          {product.inStock ? (
            <span className={cn('text-xs font-medium', product.stockCount > 0 && product.stockCount <= 5 ? 'text-warning' : 'text-success')}>
              {product.stockCount > 0 && product.stockCount <= 5 ? `Solo ${product.stockCount} restantes` : 'En stock'}
            </span>
          ) : (
            <span className="text-xs text-destructive font-medium">Sin stock</span>
          )}
        </div>

        <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
          <Truck className="h-3 w-3" />
          <span>Entrega estimada: {product.estimatedDelivery}</span>
        </div>

        {isGrid && (
          <div className="flex gap-2 mt-3">
            <Button size="sm" fullWidth asChild>
              <a href={`/producto/${product.slug}`}>Comprar</a>
            </Button>
            <Button variant="outline" size="sm" className="shrink-0" asChild>
              <a href={`/producto/${product.slug}`} aria-label="Ver detalle">
                <Eye className="h-4 w-4" />
              </a>
            </Button>
          </div>
        )}

        {!isGrid && (
          <div className="flex gap-2 mt-3">
            <Button size="sm" asChild>
              <a href={`/producto/${product.slug}`}>
                <ShoppingCart className="h-4 w-4" />
                Comprar
              </a>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href={`/producto/${product.slug}`}>Ver detalle</a>
            </Button>
          </div>
        )}
      </div>
    </article>
  );
}
