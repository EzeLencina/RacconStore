import { cn } from '@lib/helpers/cn';
import { formatPrice, Button } from '@tienda/ui';
import { CatalogProductCard } from '@components/catalog';
import type { RelationCard } from '@lib/products/relations';

type CrossSellingProps = {
  items?: RelationCard[];
  className?: string;
};

export function CrossSelling({ items, className }: CrossSellingProps) {
  const itemsToShow = items ?? [];

  if (itemsToShow.length === 0) return null;

  const totalPrice = itemsToShow.reduce((sum, item) => sum + item.price, 0);

  return (
    <section className={cn('space-y-4', className)} aria-labelledby="cross-heading">
      <h2 id="cross-heading" className="text-lg font-semibold tracking-tight">Comprados juntos</h2>

      <div className="rounded-xl border border-border p-4 sm:p-5 space-y-4">
        <p className="text-xs text-muted-foreground">
          Productos que se compran frecuentemente juntos
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {itemsToShow.map((item) => (
            <CatalogProductCard key={item.id} product={item} viewMode="grid" />
          ))}
        </div>

        {totalPrice > 0 ? (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-3 border-t border-border">
            <div>
              <p className="text-xs text-muted-foreground">Precio total:</p>
              <p className="text-xl font-bold text-foreground">{formatPrice(totalPrice)}</p>
            </div>
            <Button size="md" aria-label="Agregar todo al carrito">
              Agregar todo al carrito
            </Button>
          </div>
        ) : null}
      </div>
    </section>
  );
}