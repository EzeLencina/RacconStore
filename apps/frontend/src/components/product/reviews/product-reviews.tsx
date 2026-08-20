'use client';

import { useState } from 'react';
import { ChevronDown, ThumbsUp, ShieldCheck, Star } from 'lucide-react';
import { cn } from '@lib/helpers/cn';
import { Rating, Button } from '@tienda/ui';
import type { PDPProduct, ProductReview } from '@lib/storefront/types';

type ProductReviewsProps = {
  product: PDPProduct;
  className?: string;
};

function RatingDistribution({ product }: { product: PDPProduct }) {
  const distribution = [0, 0, 0, 0, 0];
  product.reviews.forEach((r) => {
    const idx = Math.floor(r.rating) - 1;
    if (idx >= 0 && idx < 5) distribution[idx]!++;
  });
  const maxCount = Math.max(...distribution, 1);

  return (
    <div className="space-y-1.5">
      {[5, 4, 3, 2, 1].map((star) => {
        const count = distribution[star - 1] ?? 0;
        return (
          <div key={star} className="flex items-center gap-2 text-sm">
            <span className="w-8 text-right text-muted-foreground">{star}</span>
            <Star className="h-3.5 w-3.5 fill-warning text-warning" />
            <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
              <div className="h-full rounded-full bg-warning transition-all" style={{ width: `${(count / maxCount) * 100}%` }} />
            </div>
            <span className="w-6 text-right text-xs text-muted-foreground">{count}</span>
          </div>
        );
      })}
    </div>
  );
}

function ReviewCard({ review }: { review: ProductReview }) {
  return (
    <div className="rounded-lg border border-border p-4 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium text-foreground">
            {review.author.charAt(0)}
          </div>
          <div>
            <span className="text-sm font-medium text-foreground">{review.author}</span>
            {review.verified && (
              <span className="ml-1.5 inline-flex items-center gap-0.5 text-xs text-success">
                <ShieldCheck className="h-3 w-3" />
                Compra verificada
              </span>
            )}
          </div>
        </div>
        <span className="text-xs text-muted-foreground">{review.date}</span>
      </div>

      <Rating value={review.rating} size="sm" />

      <h4 className="text-sm font-semibold text-foreground">{review.title}</h4>
      <p className="text-sm text-muted-foreground leading-relaxed">{review.comment}</p>

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <button
          type="button"
          className="inline-flex items-center gap-1 hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded px-1 py-1"
          aria-label="Me gusta esta reseña"
        >
          <ThumbsUp className="h-3 w-3" />
          {review.likes > 0 && <span>{review.likes}</span>}
        </button>
      </div>
    </div>
  );
}

const sortLabels: Record<string, string> = {
  newest: 'Más recientes',
  highest: 'Mayor puntuación',
  lowest: 'Menor puntuación',
};

export function ProductReviews({ product, className }: ProductReviewsProps) {
  const [sortBy, setSortBy] = useState('newest');
  const [showAll, setShowAll] = useState(false);

  const sorted = [...product.reviews].sort((a, b) => {
    if (sortBy === 'newest') return new Date(b.date).getTime() - new Date(a.date).getTime();
    if (sortBy === 'highest') return b.rating - a.rating;
    if (sortBy === 'lowest') return a.rating - b.rating;
    return 0;
  });

  const displayed = showAll ? sorted : sorted.slice(0, 3);

  if (product.reviews.length === 0) return null;

  return (
    <section className={cn('space-y-5', className)} aria-labelledby="reviews-heading">
      <h2 id="reviews-heading" className="flex items-center gap-2 text-lg font-semibold tracking-tight">
        Opiniones de clientes
        <span className="text-sm font-normal text-muted-foreground">({product.reviewCount} reseñas)</span>
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-2">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-foreground">{product.rating.toFixed(1)}</span>
            <span className="text-sm text-muted-foreground">/ 5</span>
          </div>
          <Rating value={product.rating} size="md" />
          <p className="text-xs text-muted-foreground">{product.reviewCount} reseñas verificadas</p>
        </div>
        <div className="md:col-span-2">
          <RatingDistribution product={product} />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">
          {product.reviewCount} reseña{product.reviewCount !== 1 ? 's' : ''}
        </span>
        <div className="relative">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="appearance-none rounded-lg border border-border bg-background px-3 py-1.5 pr-8 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Ordenar reseñas"
          >
            {Object.entries(sortLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        </div>
      </div>

      <div className="space-y-3">
        {displayed.map((review) => (
          <ReviewCard key={review.id} review={review} />
        ))}
      </div>

      {sorted.length > 3 && (
        <div className="text-center">
          <Button variant="outline" onClick={() => setShowAll(!showAll)}>
            {showAll ? 'Mostrar menos' : `Ver todas las reseñas (${sorted.length})`}
          </Button>
        </div>
      )}
    </section>
  );
}
