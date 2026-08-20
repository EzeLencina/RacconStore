'use client';

import { useState } from 'react';
import { ShoppingCart, Zap, Heart, ArrowLeftRight, Minus, Plus } from 'lucide-react';
import { Button } from '@tienda/ui';
import { cn } from '@lib/helpers/cn';
import { formatPrice } from '@tienda/ui';
import { ProductStock } from '../stock';
import { ProductShare } from '../share';
import type { PDPProduct } from '@lib/storefront/types';

type PurchaseBoxProps = {
  product: PDPProduct;
  className?: string;
};

export function PurchaseBox({ product, className }: PurchaseBoxProps) {
  const [quantity, setQuantity] = useState(1);
  const [favorited, setFavorited] = useState(false);
  const [compared, setCompared] = useState(false);

  const maxQuantity = product.inStock ? Math.min(product.stockCount, 99) : 0;

  return (
    <div className={cn('space-y-4 rounded-xl border border-border bg-background p-4 sm:p-5', className)}>
      <div className="flex items-center justify-between">
        <ProductStock product={product} />
        <span className="text-xs text-muted-foreground">{product.estimatedDelivery}</span>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-foreground">Cantidad</span>
        <div className="flex items-center rounded-lg border border-border">
          <button
            type="button"
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            disabled={quantity <= 1}
            className="p-2 hover:bg-accent transition-colors disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-l-lg"
            aria-label="Disminuir cantidad"
          >
            <Minus className="h-3.5 w-3.5" />
          </button>
          <span className="w-10 text-center text-sm font-medium tabular-nums" aria-live="polite" aria-label={`Cantidad: ${quantity}`}>
            {quantity}
          </span>
          <button
            type="button"
            onClick={() => setQuantity(Math.min(maxQuantity, quantity + 1))}
            disabled={quantity >= maxQuantity}
            className="p-2 hover:bg-accent transition-colors disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-r-lg"
            aria-label="Aumentar cantidad"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <Button size="lg" fullWidth asChild>
          <a href="#" onClick={(e) => e.preventDefault()}>
            <ShoppingCart className="h-4 w-4" />
            Agregar al carrito
          </a>
        </Button>
        <Button variant="outline" size="lg" fullWidth asChild>
          <a href="#" onClick={(e) => e.preventDefault()}>
            <Zap className="h-4 w-4" />
            Comprar ahora
          </a>
        </Button>
      </div>

      <div className="flex items-center gap-2 pt-1">
        <button
          type="button"
          onClick={() => setFavorited(!favorited)}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            favorited ? 'bg-destructive/10 text-destructive' : 'bg-muted text-muted-foreground hover:text-foreground',
          )}
          aria-label={favorited ? 'Quitar de favoritos' : 'Agregar a favoritos'}
          aria-pressed={favorited}
        >
          <Heart className={cn('h-3.5 w-3.5', favorited && 'fill-current')} />
          {favorited ? 'Favorito' : 'Favoritos'}
        </button>
        <button
          type="button"
          onClick={() => setCompared(!compared)}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            compared ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground hover:text-foreground',
          )}
          aria-label={compared ? 'Quitar de comparación' : 'Agregar a comparación'}
          aria-pressed={compared}
        >
          <ArrowLeftRight className="h-3.5 w-3.5" />
          {compared ? 'Comparando' : 'Comparar'}
        </button>
        <ProductShare product={product} />
      </div>
    </div>
  );
}
