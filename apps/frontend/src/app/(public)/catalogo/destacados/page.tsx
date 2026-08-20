import type { Metadata } from 'next';
import { Section, Container } from '@components/layout';
import { FeaturedGrid } from '@components/home/featured-grid';

export const metadata: Metadata = {
  title: 'Destacados — Tienda | Seguridad Inteligente y Domótica',
  description: 'Productos destacados de la tienda: lo mejor en cerraduras inteligentes, cámaras de seguridad, videoporteros y domótica.',
  robots: { index: true, follow: true },
};

export default function FeaturedCatalogPage() {
  return (
    <Section spacing="md">
      <Container>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Productos Destacados</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Lo más vendido en seguridad inteligente y domótica.
            </p>
          </div>
          <FeaturedGrid />
        </div>
      </Container>
    </Section>
  );
}