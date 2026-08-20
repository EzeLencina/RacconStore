'use client';

import { useState } from 'react';
import { Truck, Store, Package, Clock } from 'lucide-react';
import { Input, Button } from '@tienda/ui';
import { cn } from '@lib/helpers/cn';
import { formatPrice } from '@tienda/ui';
import type { PDPProduct } from '@lib/storefront/types';

type ProductShippingProps = {
  product: PDPProduct;
  className?: string;
};

function methodIcon(method: string) {
  const normalized = method.toLowerCase();
  if (normalized.includes('retiro') || normalized.includes('sucursal') || normalized.includes('tienda')) {
    return <Store className="h-4 w-4" />;
  }
  if (normalized.includes('express')) {
    return <Truck className="h-4 w-4" />;
  }
  return <Package className="h-4 w-4" />;
}

export function ProductShipping({ product, className }: ProductShippingProps) {
  const [postalCode, setPostalCode] = useState('');
  const [searched, setSearched] = useState(false);

  const options = product.shipping;

  const handleSearch = () => {
    if (postalCode.trim().length >= 4) setSearched(true);
  };

  return (
    <div className={cn('space-y-3', className)}>
      <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
        <Truck className="h-4 w-4 text-muted-foreground" />
        Envío y retiro
      </h3>

      <div className="flex gap-2">
        <Input
          placeholder="Ingresá tu código postal"
          value={postalCode}
          onChange={(e) => { setPostalCode(e.target.value); setSearched(false); }}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
          aria-label="Código postal"
          className="flex-1"
        />
        <Button variant="outline" size="sm" onClick={handleSearch} disabled={postalCode.trim().length < 4}>
          Calcular
        </Button>
      </div>

      {searched && options.length > 0 && (
        <div className="space-y-2" role="list" aria-label="Opciones de envío">
          {options.map((opt) => (
            <div
              key={opt.method}
              className="flex items-center justify-between rounded-lg border border-border p-3 text-sm"
              role="listitem"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="shrink-0 text-muted-foreground">{methodIcon(opt.method)}</span>
                <div className="min-w-0">
                  <p className="font-medium text-foreground truncate">{opt.method}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {opt.estimatedDays}
                  </p>
                </div>
              </div>
              <span className={cn('shrink-0 font-semibold ml-3', opt.cost === 0 ? 'text-success' : 'text-foreground')}>
                {opt.cost === 0 ? 'Gratis' : formatPrice(opt.cost)}
              </span>
            </div>
          ))}
        </div>
      )}

      {searched && options.length === 0 && (
        <p className="text-xs text-muted-foreground">
          Sin información de envío disponible para este producto en este momento.
        </p>
      )}

      {!searched && (
        <p className="text-xs text-muted-foreground">
          {product.estimatedDelivery} • Consultá costos y tiempos para tu zona
        </p>
      )}
    </div>
  );
}