import type { Metadata } from 'next';
import { getTenantId } from '@lib/auth/tenant';
import { Hero } from '@components/home/hero';
import { Categories } from '@components/home/categories';
import { FeaturedProducts } from '@components/home/featured-products';
import { Deals } from '@components/home/deals';
import { Brands } from '@components/home/brands';
import { Benefits } from '@components/home/benefits';
import { Promotions } from '@components/home/promotions';
import { Testimonials } from '@components/home/testimonials';
import { Faq } from '@components/home/faq';
import { Cta } from '@components/home/cta';
import { FaqSchema } from '@components/seo';
import { faqItems } from '@lib/home';
import {
  listFeaturedStorefrontProducts,
  listPromotedProducts,
  listPublicBrands,
  listPublicCategories,
} from '@lib/storefront/catalog';

export const metadata: Metadata = {
  title: 'Tienda — Seguridad Inteligente y Domótica',
  description: 'Descubrí la mejor tecnología en seguridad inteligente, cerraduras digitales, cámaras HD y domótica. Envíos a todo el país. 12 cuotas sin interés.',
  openGraph: {
    title: 'Tienda — Seguridad Inteligente y Domótica',
    description: 'Descubrí la mejor tecnología en seguridad inteligente, cerraduras digitales, cámaras HD y domótica.',
    url: '/',
    siteName: 'Tienda',
    images: [{ url: '/og-home.jpg', width: 1200, height: 630 }],
    locale: 'es_AR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Tienda — Seguridad Inteligente y Domótica',
    description: 'Descubrí la mejor tecnología en seguridad inteligente, cerraduras digitales, cámaras HD y domótica.',
    images: ['/og-home.jpg'],
  },
  alternates: {
    canonical: '/',
  },
};

export default async function HomePage() {
  const tenantId = getTenantId();

  const [featured, categories, brands, deals] = await Promise.all([
    listFeaturedStorefrontProducts(tenantId),
    listPublicCategories(tenantId),
    listPublicBrands(tenantId),
    listPromotedProducts(tenantId),
  ]);

  return (
    <>
      <FaqSchema items={faqItems} />
      <Hero />
      <Categories items={categories} />
      <FeaturedProducts items={featured} />
      <Deals items={deals} />
      <Brands items={brands} />
      <Benefits />
      <Promotions />
      <Testimonials />
      <Faq />
      <Cta />
    </>
  );
}