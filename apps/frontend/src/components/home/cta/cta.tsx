import { ArrowRight } from 'lucide-react';
import { cn } from '@lib/helpers/cn';
import { ctaSection } from '@lib/home';
import { Container } from '@components/layout/containers/container';
import { Button } from '@tienda/ui';

type CtaProps = {
  className?: string;
};

export function Cta({ className }: CtaProps) {
  return (
    <section className={cn('py-16 sm:py-20 lg:py-24', className)}>
      <Container size="lg">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-primary/80 px-6 py-12 sm:px-12 sm:py-16 lg:px-16 lg:py-20">
          <div className="absolute top-0 right-0 h-full w-1/2 opacity-10">
            <div className="h-full w-full rounded-full bg-white blur-3xl" />
          </div>
          <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="max-w-xl text-center lg:text-left">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-primary-foreground">
                {ctaSection.title}
              </h2>
              <p className="mt-3 text-sm sm:text-base text-primary-foreground/80">
                {ctaSection.description}
              </p>
              <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                <Button size="lg" variant="secondary" asChild>
                  <a href={ctaSection.ctaHref}>
                    {ctaSection.cta}
                    <ArrowRight className="h-4 w-4" />
                  </a>
                </Button>
                <Button size="lg" variant="outline" className="border-white/20 text-primary-foreground hover:bg-white/10" asChild>
                  <a href={ctaSection.secondaryCtaHref}>
                    {ctaSection.secondaryCta}
                  </a>
                </Button>
              </div>
            </div>
            <div className="hidden lg:block shrink-0">
              <div className="h-48 w-48 rounded-full bg-white/10" />
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
