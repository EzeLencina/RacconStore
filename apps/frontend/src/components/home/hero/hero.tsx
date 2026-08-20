'use client';

import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { cn } from '@lib/helpers/cn';
import { Button } from '@tienda/ui';
import { heroSlides, type HeroSlide } from '@lib/home';
import { Container } from '@components/layout/containers/container';

export type HeroProps = {
  className?: string;
  autoPlayInterval?: number;
};

function HeroSlideCard({ slide, isActive, direction }: { slide: HeroSlide; isActive: boolean; direction: number }) {
  const alignClass = slide.alignment === 'center' ? 'text-center items-center' :
    slide.alignment === 'right' ? 'text-right items-end' : 'text-left items-start';

  return (
    <div
      className={cn(
        'absolute inset-0 transition-all duration-700 ease-in-out',
        isActive ? 'opacity-100 translate-x-0' : direction > 0 ? 'opacity-0 translate-x-full' : 'opacity-0 -translate-x-full',
      )}
      aria-hidden={!isActive}
    >
      <div className={cn('flex h-full w-full bg-gradient-to-r', slide.bgColor)}>
        <div className={cn('flex flex-1 flex-col justify-center px-6 sm:px-12 lg:px-16', alignClass)}>
          <h1 className="max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl xl:text-6xl text-foreground whitespace-pre-line">
            {slide.title}
          </h1>
          <p className="mt-4 max-w-xl text-sm sm:text-base text-muted-foreground">
            {slide.subtitle}
          </p>
          <div className={cn('mt-6 sm:mt-8 flex gap-3 flex-wrap', slide.alignment === 'center' ? 'justify-center' : slide.alignment === 'right' ? 'justify-end' : '')}>
            <Button size="lg" asChild>
              <a href={slide.ctaHref}>
                {slide.cta}
                <ArrowRight className="h-4 w-4" />
              </a>
            </Button>
            {slide.secondaryCta && (
              <Button variant="outline" size="lg" asChild>
                <a href={slide.secondaryCtaHref}>
                  {slide.secondaryCta}
                </a>
              </Button>
            )}
          </div>
        </div>
        <div className="hidden lg:flex flex-1 items-center justify-center p-8">
          <div className="relative h-full w-full max-w-lg rounded-2xl bg-muted/50" />
        </div>
      </div>
    </div>
  );
}

export function Hero({ className, autoPlayInterval = 6000 }: HeroProps) {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(0);

  const goTo = useCallback((index: number) => {
    setDirection(index > current ? 1 : -1);
    setCurrent(index);
  }, [current]);

  const next = useCallback(() => {
    setDirection(1);
    setCurrent((prev) => (prev + 1) % heroSlides.length);
  }, []);

  const prev = useCallback(() => {
    setDirection(-1);
    setCurrent((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);
  }, []);

  useEffect(() => {
    const timer = setInterval(next, autoPlayInterval);
    return () => clearInterval(timer);
  }, [autoPlayInterval, next]);

  return (
    <section className={cn('relative overflow-hidden', className)} aria-label="Featured promotions" aria-roledescription="carousel">
      <div className="relative h-[70vh] min-h-[500px] max-sm:min-h-[400px] max-h-[700px]">
        {heroSlides.map((slide, i) => (
          <HeroSlideCard key={slide.id} slide={slide} isActive={i === current} direction={direction} />
        ))}
      </div>

      <button
        type="button"
        onClick={prev}
        className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-background/80 p-2 shadow-lg backdrop-blur-sm hover:bg-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label="Previous slide"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        type="button"
        onClick={next}
        className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-background/80 p-2 shadow-lg backdrop-blur-sm hover:bg-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label="Next slide"
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2" role="tablist" aria-label="Slide indicators">
        {heroSlides.map((slide, i) => (
          <button
            key={slide.id}
            type="button"
            role="tab"
            aria-selected={i === current}
            aria-label={`Slide ${i + 1}`}
            onClick={() => goTo(i)}
            className={cn(
              'h-2 rounded-full transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              i === current ? 'w-8 bg-primary' : 'w-2 bg-foreground/20 hover:bg-foreground/40',
            )}
          />
        ))}
      </div>
    </section>
  );
}
