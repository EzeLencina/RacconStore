'use client';

import { useEffect, useState } from 'react';
import { RelatedProducts } from '../related-products/related-products';
import { CrossSelling } from '../cross-selling/cross-selling';
import type { PDPProduct } from '@lib/storefront/types';
import type { RelationCard } from '@lib/products/relations';

type ProductRelationsProps = {
  product: PDPProduct;
};

type RelationsPayload = {
  related: RelationCard[];
  complementary: RelationCard[];
};

export function ProductRelations({ product }: ProductRelationsProps) {
  const [relations, setRelations] = useState<RelationsPayload | null>(null);

  useEffect(() => {
    let active = true;
    fetch(`/api/products/${encodeURIComponent(product.slug)}/relations`)
      .then((response) => (response.ok ? response.json() : Promise.resolve(null)))
      .then((data: RelationsPayload | null) => {
        if (active && data) {
          setRelations(data);
        }
      })
      .catch(() => {
        // Sin relaciones disponibles: las secciones no se renderizan
      });
    return () => {
      active = false;
    };
  }, [product.slug]);

  const related = relations?.related;
  const complementary = relations?.complementary;

  if (!relations) return null;

  return (
    <>
      <RelatedProducts items={related} />
      <CrossSelling items={complementary} />
    </>
  );
}