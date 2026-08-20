import type { Metadata } from 'next';
import {
  SITE_NAME, SITE_DESCRIPTION, SITE_URL, SITE_LOCALE,
  OG_IMAGE_DEFAULT, OG_IMAGE_WIDTH, OG_IMAGE_HEIGHT, SITE_TWITTER_HANDLE,
} from './constants';

type SEOOptions = {
  title: string;
  description: string;
  path: string;
  images?: { url: string; width?: number; height?: number; alt?: string }[];
  noindex?: boolean;
  nofollow?: boolean;
  publishedTime?: string;
  modifiedTime?: string;
  type?: 'website' | 'article';
  tags?: string[];
};

export function buildMetadata(options: SEOOptions): Metadata {
  const {
    title,
    description,
    path,
    images = [{ url: OG_IMAGE_DEFAULT, width: OG_IMAGE_WIDTH, height: OG_IMAGE_HEIGHT }],
    noindex,
    nofollow,
    type = 'website',
  } = options;

  const url = `${SITE_URL}${path}`;

  return {
    title,
    description,
    metadataBase: new URL(SITE_URL),
    alternates: { canonical: path },
    robots: {
      index: !noindex,
      follow: !nofollow,
    },
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      images: images.map((img) => ({
        url: img.url,
        width: img.width ?? OG_IMAGE_WIDTH,
        height: img.height ?? OG_IMAGE_HEIGHT,
        alt: img.alt ?? title,
      })),
      locale: SITE_LOCALE,
      type,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: images.map((img) => img.url),
      site: SITE_TWITTER_HANDLE,
    },
  };
}

export function buildProductMetadata(
  name: string,
  description: string,
  slug: string,
  imageUrl?: string,
  price?: number,
): Metadata {
  const images = imageUrl
    ? [{ url: imageUrl, width: 800, height: 800, alt: name }]
    : undefined;

  return buildMetadata({
    title: `${name} — ${SITE_NAME}`,
    description,
    path: `/product/${slug}`,
    images,
  });
}

export function buildCategoryMetadata(
  name: string,
  description: string,
  slug: string,
  productCount?: number,
): Metadata {
  const count = productCount ? ` — ${productCount} productos` : '';
  return buildMetadata({
    title: `${name} | Seguridad y Control de Acceso${count} — ${SITE_NAME}`,
    description: `${description} Compra online con envíos a todo el país. 12 cuotas sin interés.`,
    path: `/categoria/${slug}`,
  });
}

export function buildBrandMetadata(
  name: string,
  description: string,
  slug: string,
): Metadata {
  return buildMetadata({
    title: `Productos ${name} — ${SITE_NAME}`,
    description: `Descubrí todos los productos de ${name}. ${description}`,
    path: `/marca/${slug}`,
  });
}
