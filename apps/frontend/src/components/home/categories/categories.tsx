import { cn } from '@lib/helpers/cn';
import { Container } from '@components/layout/containers/container';
import { SectionTitle, CategoryCard } from '@tienda/ui';
import type { StorefrontCategory } from '@lib/storefront/types';

type CategoriesProps = {
  items?: StorefrontCategory[];
  className?: string;
};

export function Categories({ items, className }: CategoriesProps) {
  const categories = items ?? [];

  if (categories.length === 0) return null;

  return (
    <section className={cn('py-12 sm:py-16', className)}>
      <Container size="xl">
        <SectionTitle
          title="Categorías"
          description="Explorá nuestra gama completa de productos para hogar y empresa"
          align="center"
          spacing="loose"
        />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6">
          {categories.map((cat) => (
            <CategoryCard
              key={cat.id}
              id={cat.id}
              name={cat.name}
              href={`/categoria/${cat.slug}`}
              productCount={cat.productCount}
            />
          ))}
        </div>
      </Container>
    </section>
  );
}