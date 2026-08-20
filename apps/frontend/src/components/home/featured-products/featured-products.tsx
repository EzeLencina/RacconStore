import { cn } from '@lib/helpers/cn';
import { Container } from '@components/layout/containers/container';
import { SectionTitle } from '@tienda/ui';
import { FeaturedGrid } from '../featured-grid';

type FeaturedProductsProps = {
  className?: string;
};

export function FeaturedProducts({ className }: FeaturedProductsProps) {
  return (
    <section className={cn('py-12 sm:py-16 bg-muted/30', className)}>
      <Container size="xl">
        <SectionTitle
          title="Productos Destacados"
          description="Lo más vendido en seguridad inteligente y domótica"
          align="center"
          spacing="loose"
        />
        <FeaturedGrid />
      </Container>
    </section>
  );
}