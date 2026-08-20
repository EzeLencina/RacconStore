import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTenantId } from '@lib/auth/tenant';
import { getPublicProductBySlug } from '@lib/storefront/catalog';
import { ProductSchema, BreadcrumbSchema } from '@components/seo';
import { buildProductMetadata } from '@lib/seo';
import { PDPClient } from './pdp-client';

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getPublicProductBySlug(getTenantId(), slug);

  if (!product) return { title: 'Producto no encontrado | Tienda' };

  return buildProductMetadata(
    product.name,
    product.shortDescription,
    product.slug,
    product.images[0]?.src,
    product.price,
  );
}

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params;
  const product = await getPublicProductBySlug(getTenantId(), slug);

  if (!product) notFound();

  const breadcrumbItems = [
    { name: 'Inicio', item: '/' },
    { name: 'Catálogo', item: '/catalogo' },
    ...(product.categorySlug
      ? [{ name: product.category, item: `/categoria/${product.categorySlug}` }]
      : []),
  ];

  return (
    <>
      <ProductSchema product={product} />
      <BreadcrumbSchema items={breadcrumbItems} />
      <PDPClient product={product} />
    </>
  );
}