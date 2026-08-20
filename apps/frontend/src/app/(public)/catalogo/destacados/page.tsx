import type { Metadata } from 'next';
import { getTenantId } from '@lib/auth/tenant';
import { Section, Container } from '@components/layout';
import { FeaturedGrid } from '@components/home/featured-grid';
import { listFeaturedStorefrontProducts } from '@lib/storefront/catalog';

export const metadata: Metadata = {
  title: 'Destacados — Tienda | Seguridad Inteligente y Domótica',
  description: 'Productos destacados de la tienda: lo mejor en cerraduras inteligentes, cámaras de seguridad, videoporteros y domótica.',
  robots: { index: true, follow: true },
};

export default async function FeaturedCatalogPage() {
  const tenantId = getTenantId();
  const products = await listFeaturedStorefrontProducts(tenantId, 12);

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
          {products.length > 0 ? (
            <FeaturedGrid items={products} />
          ) : (
            <p className="text-sm text-muted-foreground">
              No hay productos destacados disponibles por el momento.
            </p>
          )}
        </div>
      </Container>
    </Section>
  );
}