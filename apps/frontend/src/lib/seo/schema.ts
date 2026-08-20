import { SITE_NAME, SITE_URL, ORGANIZATION } from './constants';

export function organizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization' as const,
    name: ORGANIZATION.name,
    legalName: ORGANIZATION.legalName,
    url: SITE_URL,
    logo: `${SITE_URL}${ORGANIZATION.logo}`,
    sameAs: ORGANIZATION.sameAs,
    address: {
      '@type': 'PostalAddress' as const,
      streetAddress: ORGANIZATION.address.street,
      addressLocality: ORGANIZATION.address.locality,
      addressRegion: ORGANIZATION.address.region,
      addressCountry: ORGANIZATION.address.country,
    },
    contactPoint: {
      '@type': 'ContactPoint' as const,
      telephone: ORGANIZATION.contact.telephone,
      email: ORGANIZATION.contact.email,
      contactType: 'customer service',
    },
  };
}

export function websiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite' as const,
    name: SITE_NAME,
    url: SITE_URL,
    potentialAction: {
      '@type': 'SearchAction' as const,
      target: {
        '@type': 'EntryPoint' as const,
        urlTemplate: `${SITE_URL}/buscar?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

export function productSchema(product: {
  name: string;
  description: string;
  sku: string;
  mpn: string;
  brand: string;
  category: string;
  price: number;
  inStock: boolean;
  slug: string;
  rating?: number;
  reviewCount?: number;
  images: { src: string }[];
  offers?: Record<string, unknown>;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product' as const,
    name: product.name,
    description: product.description,
    sku: product.sku,
    mpn: product.mpn,
    brand: { '@type': 'Brand' as const, name: product.brand },
    category: product.category,
    offers: product.offers ?? {
      '@type': 'Offer' as const,
      price: product.price,
      priceCurrency: 'ARS',
      availability: product.inStock
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      url: `${SITE_URL}/product/${product.slug}`,
    },
    image: product.images.map((i) => i.src),
    ...(product.rating && {
      aggregateRating: {
        '@type': 'AggregateRating' as const,
        ratingValue: product.rating,
        reviewCount: product.reviewCount ?? 0,
      },
    }),
  };
}

export function breadcrumbSchema(items: { name: string; item: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList' as const,
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem' as const,
      position: i + 1,
      name: item.name,
      item: `${SITE_URL}${item.item}`,
    })),
  };
}

export function faqSchema(items: { question: string; answer: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage' as const,
    mainEntity: items.map((item) => ({
      '@type': 'Question' as const,
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer' as const,
        text: item.answer,
      },
    })),
  };
}
