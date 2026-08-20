'use client';

import { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@lib/helpers/cn';
import { CatalogProductCard } from '@components/catalog';
import { getRelatedProducts, pdpProducts } from '../mock-data';
import type { PDPProduct } from '../mock-data';
import type { RelationCard } from '@lib/products/relations';

type RelatedProductsProps = {
  product: PDPProduct;
  title?: string;
  className?: string;
  items?: RelationCard[];
};

export function RelatedProducts({
  product,
  title = 'Productos relacionados',
  className,
  items,
}: RelatedProductsProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const related = items ?? getRelatedProducts(product.relatedSlugs);

  if (related.length === 0) return null;

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const amount = scrollRef.current.clientWidth * 0.75;
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -amount : amount,
      behavior: 'smooth',
    });
  };

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  const toCard = (p: PDPProduct | RelationCard) =>
    'crossSellSlugs' in p ? {
      ...p,
      brand: '',
      brandSlug: '',
      category: '',
      categorySlug: '',
      subcategory: '',
      subcategorySlug: '',
      images: [],
      image: '',
      originalPrice: undefined,
      discount: undefined,
      rating: 0,
      reviewCount: 0,
      badge: undefined,
      badgeVariant: undefined,
      stockCount: 0,
      isNew: undefined,
      isFeatured: undefined,
      estimatedDelivery: '',
      warranty: '',
      specs: {},
    } : p;

  return (
    <section className={cn('space-y-4', className)} aria-labelledby="related-heading">
      <div className="flex items-center justify-between">
        <h2 id="related-heading" className="text-lg font-semibold tracking-tight">{title}</h2>
        <div className="hidden sm:flex items-center gap-1">
          <button
            type="button"
            onClick={() => scroll('left')}
            disabled={!canScrollLeft}
            className="rounded-lg border border-border p-1.5 hover:bg-accent transition-colors disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => scroll('right')}
            disabled={!canScrollRight}
            className="rounded-lg border border-border p-1.5 hover:bg-accent transition-colors disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Siguiente"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex gap-4 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4 snap-x snap-mandatory"
      >
        {related.map((p) => (
          <div key={p.id} className="min-w-[220px] sm:min-w-[240px] max-w-[260px] snap-start">
            <CatalogProductCard product={toCard(p)} viewMode="grid" />
          </div>
        ))}
      </div>
    </section>
  );
}
