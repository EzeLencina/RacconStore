'use client';

import { useEffect, useState } from 'react';
import { CatalogProductCard } from '@components/catalog';
import type { RelationCard } from '@lib/products/relations.types';

type FeaturedGridProps = {
  className?: string;
};

export function FeaturedGrid({ className }: FeaturedGridProps) {
  const [items, setItems] = useState<RelationCard[] | null>(null);

  useEffect(() => {
    let active = true;
    fetch('/api/public/featured')
      .then((response) => (response.ok ? response.json() : Promise.resolve(null)))
      .then((data: { items?: RelationCard[] } | null) => {
        if (active && data?.items) {
          setItems(data.items);
        } else if (active) {
          setItems([]);
        }
      })
      .catch(() => {
        if (active) setItems([]);
      });
    return () => {
      active = false;
    };
  }, []);

  if (items === null) return null;
  if (items.length === 0) return null;

  return (
    <div
      className={
        className ??
        'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6'
      }
    >
      {items.map((product) => (
        <CatalogProductCard key={product.id} product={product} viewMode="grid" />
      ))}
    </div>
  );
}