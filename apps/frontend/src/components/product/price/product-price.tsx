import { cn } from '@lib/helpers/cn';
import { formatPrice } from '@tienda/ui';
import type { PDPProduct } from '@lib/storefront/types';

type ProductPriceProps = {
  product: PDPProduct;
  className?: string;
};

export function ProductPrice({ product, className }: ProductPriceProps) {
  const hasDiscount = product.originalPrice && product.discount;

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-baseline gap-3 flex-wrap">
        <span className="text-3xl sm:text-4xl font-bold text-foreground">
          {formatPrice(product.price)}
        </span>
        {hasDiscount && (
          <>
            <span className="text-lg text-muted-foreground line-through">
              {formatPrice(product.originalPrice!)}
            </span>
            <span className="inline-flex items-center rounded-full bg-destructive/10 px-2.5 py-0.5 text-xs font-semibold text-destructive">
              -{product.discount}%
            </span>
          </>
        )}
      </div>

      {hasDiscount && product.savings && (
        <p className="text-sm text-success font-medium">
          Ahorrá {formatPrice(product.savings)}
        </p>
      )}

      {product.installments.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Medios de pago</p>
          <div className="flex flex-wrap gap-2">
            {product.installments.map((inst) => (
              <div
                key={inst.count}
                className={cn(
                  'rounded-lg border px-3 py-2 text-sm',
                  !inst.interest
                    ? 'border-success/30 bg-success/5 text-success'
                    : 'border-border bg-background text-muted-foreground',
                )}
              >
                <span className="font-bold">{inst.count}x</span>{' '}
                {formatPrice(inst.installmentPrice)}
                {!inst.interest && (
                  <span className="ml-1 text-xs font-semibold">sin interés</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
