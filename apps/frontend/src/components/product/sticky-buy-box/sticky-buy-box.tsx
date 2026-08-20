'use client';

import { useState, useEffect } from 'react';
import { ShoppingCart } from 'lucide-react';
import { cn } from '@lib/helpers/cn';
import { Button } from '@tienda/ui';
import { formatPrice } from '@tienda/ui';
import type { PDPProduct } from '@lib/storefront/types';

type StickyBuyBoxProps = {
  product: PDPProduct;
  className?: string;
};

export function StickyBuyBox({ product, className }: StickyBuyBoxProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > 600);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div
      className={cn(
        'fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur-md shadow-lg transition-transform duration-300',
        'sm:bottom-auto sm:top-24 sm:right-4 sm:left-auto sm:w-72 sm:border sm:rounded-xl sm:shadow-xl',
        visible ? 'translate-y-0' : 'translate-y-full sm:translate-y-0 sm:opacity-0 sm:pointer-events-none',
        className,
      )}
      role="complementary"
      aria-label="Compra rápida"
    >
      <div className="flex items-center sm:flex-col gap-3 p-3 sm:p-4">
        <div className="hidden sm:block text-center mb-1">
          <p className="text-xs text-muted-foreground line-clamp-1">{product.name}</p>
          <div className="flex items-baseline justify-center gap-2 mt-1">
            <span className="text-xl font-bold text-foreground">{formatPrice(product.price)}</span>
            {product.originalPrice && (
              <span className="text-xs text-muted-foreground line-through">{formatPrice(product.originalPrice)}</span>
            )}
          </div>
        </div>

        <div className="flex-1 flex items-center justify-between sm:hidden">
          <div>
            <p className="text-sm text-foreground line-clamp-1">{product.name}</p>
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-bold text-foreground">{formatPrice(product.price)}</span>
              {product.originalPrice && (
                <span className="text-xs text-muted-foreground line-through">{formatPrice(product.originalPrice)}</span>
              )}
            </div>
          </div>
        </div>

        <Button size="sm" className="shrink-0 sm:w-full" asChild>
          <a href="#" onClick={(e) => e.preventDefault()}>
            <ShoppingCart className="h-4 w-4" />
            Agregar
          </a>
        </Button>
      </div>
    </div>
  );
}
