'use client';

import { useState, useEffect } from 'react';
import { Clock, ArrowRight, Zap } from 'lucide-react';
import { cn } from '@lib/helpers/cn';
import { dealsCountdownTarget } from '@lib/home';
import { Container } from '@components/layout/containers/container';
import { SectionTitle, Badge, Rating, Button } from '@tienda/ui';
import { formatPrice } from '@tienda/ui';
import type { StorefrontProduct } from '@lib/storefront/types';

type DealsProps = {
  items?: StorefrontProduct[];
  className?: string;
};

function useCountdown(targetDate: string) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const target = new Date(targetDate).getTime();

    function tick() {
      const now = Date.now();
      const diff = Math.max(0, target - now);
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      });
    }

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  return timeLeft;
}

function CountdownTimer({ targetDate }: { targetDate: string }) {
  const time = useCountdown(targetDate);

  return (
    <div className="flex items-center gap-3">
      <Clock className="h-4 w-4 text-muted-foreground" />
      <div className="flex gap-2 text-sm font-semibold tabular-nums">
        <span className="rounded-md bg-destructive/10 px-2 py-1 text-destructive">{String(time.days).padStart(2, '0')}d</span>
        <span className="rounded-md bg-destructive/10 px-2 py-1 text-destructive">{String(time.hours).padStart(2, '0')}h</span>
        <span className="rounded-md bg-destructive/10 px-2 py-1 text-destructive">{String(time.minutes).padStart(2, '0')}m</span>
        <span className="rounded-md bg-destructive/10 px-2 py-1 text-destructive">{String(time.seconds).padStart(2, '0')}s</span>
      </div>
    </div>
  );
}

export function Deals({ items, className }: DealsProps) {
  const products = items ?? [];

  if (products.length === 0) return null;

  return (
    <section className={cn('py-12 sm:py-16', className)}>
      <Container size="xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-destructive/10 p-2">
              <Zap className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Ofertas por Tiempo Limitado</h2>
              <p className="text-sm text-muted-foreground">Aprovechá estos precios antes de que se acaben</p>
            </div>
          </div>
          <CountdownTimer targetDate={dealsCountdownTarget} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {products.map((product) => (
            <article
              key={product.id}
              className="group relative rounded-xl border-2 border-destructive/20 bg-background overflow-hidden transition-all duration-200 hover:shadow-md hover:border-destructive/40"
            >
              <div className="relative">
                <div className="relative aspect-square bg-muted flex items-center justify-center p-8">
                  <div className="h-full w-full rounded-lg bg-muted-foreground/10" />
                </div>
                {product.badge && (
                  <div className="absolute top-2 left-2">
                    <Badge variant="danger" size="sm">{product.badge}</Badge>
                  </div>
                )}
              </div>

              <div className="p-4 space-y-2">
                <p className="text-xs text-muted-foreground">{product.brand}</p>
                <a href={`/product/${product.slug}`} className="block">
                  <h3 className="text-sm font-medium text-foreground line-clamp-2 hover:text-primary transition-colors">
                    {product.name}
                  </h3>
                </a>

                <div className="flex items-baseline gap-2">
                  <span className="text-lg font-bold text-destructive">{formatPrice(product.price)}</span>
                  {product.originalPrice && (
                    <span className="text-sm text-muted-foreground line-through">{formatPrice(product.originalPrice)}</span>
                  )}
                </div>

                <Rating value={product.rating} size="sm" />
              </div>

              <div className="px-4 pb-4">
                <Button size="sm" fullWidth asChild>
                  <a href={`/product/${product.slug}`}>Aprovechar Oferta</a>
                </Button>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-8 text-center">
          <Button variant="outline" asChild>
            <a href="/catalogo?sort=price-desc">
              Ver Todos los Productos
              <ArrowRight className="h-4 w-4" />
            </a>
          </Button>
        </div>
      </Container>
    </section>
  );
}