import { cn } from '@lib/helpers/cn';
import { Container } from '@components/layout/containers/container';
import { SectionTitle } from '@tienda/ui';
import type { StorefrontBrand } from '@lib/storefront/types';

type BrandsProps = {
  items?: StorefrontBrand[];
  className?: string;
};

export function Brands({ items, className }: BrandsProps) {
  const brands = items ?? [];

  if (brands.length === 0) return null;

  return (
    <section className={cn('py-12 sm:py-16 bg-muted/30', className)}>
      <Container size="xl">
        <SectionTitle
          title="Marcas Oficiales"
          description="Trabajamos con las marcas líderes en seguridad y domótica"
          align="center"
          spacing="loose"
        />
        <div className="flex flex-wrap justify-center gap-3">
          {brands.map((brand) => (
            <a
              key={brand.id}
              href={`/catalogo?brand=${brand.slug}`}
              className="flex shrink-0 items-center justify-center min-w-[140px] h-20 rounded-xl border border-border bg-background px-6 hover:shadow-sm hover:border-foreground/20 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors">
                {brand.name}
              </span>
            </a>
          ))}
        </div>
      </Container>
    </section>
  );
}