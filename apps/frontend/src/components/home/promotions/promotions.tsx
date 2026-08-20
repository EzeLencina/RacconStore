'use client';

import { useState } from 'react';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@lib/helpers/cn';
import { promoBanners, type PromoBanner } from '@lib/home';
import { Container } from '@components/layout/containers/container';
import { Button } from '@tienda/ui';

type PromotionsProps = {
  className?: string;
};

function PromoBannerCard({ banner, isActive }: { banner: PromoBanner; isActive: boolean }) {
  return (
    <div
      className={cn(
        'absolute inset-0 rounded-2xl overflow-hidden transition-all duration-500',
        isActive ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full',
      )}
      aria-hidden={!isActive}
    >
      <div className={cn('flex h-full w-full bg-gradient-to-r', banner.bgColor)}>
        <div className="flex flex-1 flex-col justify-center p-8 sm:p-12 lg:p-16">
          <span className="inline-block rounded-full bg-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-wider mb-4 text-white">
            {banner.campaign}
          </span>
          <h2 className={cn('text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight max-w-md', banner.textColor)}>
            {banner.title}
          </h2>
          <p className={cn('mt-3 text-sm sm:text-base max-w-lg opacity-90', banner.textColor)}>
            {banner.subtitle}
          </p>
          <div className="mt-6">
            <Button size="lg" variant="secondary" asChild>
              <a href={banner.ctaHref}>
                {banner.cta}
                <ArrowRight className="h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>
        <div className="hidden lg:flex flex-1 items-center justify-center p-8">
          <div className="h-48 w-48 rounded-full bg-white/10" />
        </div>
      </div>
    </div>
  );
}

export function Promotions({ className }: PromotionsProps) {
  const [current, setCurrent] = useState(0);

  const next = () => setCurrent((prev) => (prev + 1) % promoBanners.length);
  const prev = () => setCurrent((prev) => (prev - 1 + promoBanners.length) % promoBanners.length);

  if (promoBanners.length === 0) return null;

  return (
    <section className={cn('py-12 sm:py-16', className)}>
      <Container size="xl">
        <div className="relative h-[300px] sm:h-[350px] lg:h-[400px] rounded-2xl overflow-hidden">
          {promoBanners.map((banner, i) => (
            <PromoBannerCard key={banner.id} banner={banner} isActive={i === current} />
          ))}

          {promoBanners.length > 1 && (
            <>
              <button type="button" onClick={prev} className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-black/20 p-2 text-white hover:bg-black/40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white" aria-label="Previous promotion">
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button type="button" onClick={next} className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-black/20 p-2 text-white hover:bg-black/40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white" aria-label="Next promotion">
                <ChevronRight className="h-5 w-5" />
              </button>
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                {promoBanners.map((banner, i) => (
                  <button key={banner.id} type="button" onClick={() => setCurrent(i)} className={cn('h-2 rounded-full transition-all', i === current ? 'w-8 bg-white' : 'w-2 bg-white/50')} aria-label={`Promotion ${i + 1}`} />
                ))}
              </div>
            </>
          )}
        </div>
      </Container>
    </section>
  );
}
