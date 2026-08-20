'use client';

import { useState } from 'react';
import { cn } from '@lib/helpers/cn';
import type { PDPProduct, ProductVariant } from '@lib/storefront/types';

type ProductVariantsProps = {
  product: PDPProduct;
  className?: string;
};

type GroupedVariants = Record<string, ProductVariant[]>;

function groupVariants(variants: ProductVariant[]): GroupedVariants {
  return variants.reduce((acc, v) => {
    (acc[v.type] ??= []).push(v);
    return acc;
  }, {} as GroupedVariants);
}

const typeLabels: Record<string, string> = {
  color: 'Color',
  finish: 'Terminación',
  version: 'Versión',
  kit: 'Kit',
  capacity: 'Capacidad',
  model: 'Modelo',
};

export function ProductVariants({ product, className }: ProductVariantsProps) {
  const [selected, setSelected] = useState<Record<string, string>>({});
  const grouped = groupVariants(product.variants);

  if (product.variants.length === 0) return null;

  return (
    <div className={cn('space-y-4', className)}>
      {Object.entries(grouped).map(([type, variants]) => {
        const label = typeLabels[type] ?? type;
        const currentValue = selected[type] ?? variants.find((v) => v.available)?.value ?? '';

        return (
          <fieldset key={type}>
            <legend className="text-sm font-medium text-foreground mb-2">
              {label}: <span className="text-muted-foreground font-normal">{currentValue}</span>
            </legend>
            <div className="flex flex-wrap gap-2">
              {variants.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  disabled={!v.available}
                  onClick={() => setSelected((prev) => ({ ...prev, [type]: v.value }))}
                  className={cn(
                    'rounded-lg border px-3 py-1.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    selected[type] === v.value || (!selected[type] && v.available && variants.indexOf(v) === 0)
                      ? 'border-primary bg-primary/5 text-primary'
                      : v.available
                        ? 'border-border hover:border-muted-foreground/30 text-foreground'
                        : 'border-border/50 text-muted-foreground/40 line-through cursor-not-allowed',
                  )}
                  aria-pressed={selected[type] === v.value || (!selected[type] && variants.indexOf(v) === 0)}
                >
                  {v.value}
                </button>
              ))}
            </div>
          </fieldset>
        );
      })}
    </div>
  );
}
