import type { MetadataRoute } from 'next';
import { SITE_URL } from '@lib/seo';
import { getTenantId } from '@lib/auth/tenant';
import {
  listPublicCatalog,
  listPublicCategories,
  STOREFRONT_MAX_ITEMS,
} from '@lib/storefront/catalog';

function buildSitemapEntry(
  path: string,
  priority?: number,
  changeFrequency?: 'daily' | 'weekly' | 'monthly' | 'yearly',
): MetadataRoute.Sitemap[number] {
  return {
    url: `${SITE_URL}${path}`,
    lastModified: new Date(),
    changeFrequency: changeFrequency ?? 'weekly',
    priority: priority ?? 0.5,
  };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const tenantId = getTenantId();
  const entries: MetadataRoute.Sitemap = [];

  // Home
  entries.push(buildSitemapEntry('/', 1.0, 'weekly'));

  // Catalog
  entries.push(buildSitemapEntry('/catalogo', 0.9, 'daily'));
  entries.push(buildSitemapEntry('/catalogo/destacados', 0.7, 'weekly'));

  // Static pages
  entries.push(buildSitemapEntry('/login', 0.4, 'monthly'));
  entries.push(buildSitemapEntry('/register', 0.4, 'monthly'));
  entries.push(buildSitemapEntry('/cart', 0.3, 'monthly'));
  entries.push(buildSitemapEntry('/checkout', 0.3, 'monthly'));
  entries.push(buildSitemapEntry('/account', 0.3, 'monthly'));

  // Categories (with their children)
  const categories = await listPublicCategories(tenantId);
  for (const cat of categories) {
    entries.push(buildSitemapEntry(cat.href, 0.8, 'daily'));
    if (cat.children) {
      for (const child of cat.children) {
        entries.push(buildSitemapEntry(child.href, 0.7, 'daily'));
      }
    }
  }

  // Products
  const catalog = await listPublicCatalog({
    tenantId,
    sort: 'newest',
    page: 1,
    pageSize: STOREFRONT_MAX_ITEMS,
  });
  for (const product of catalog.products) {
    entries.push(buildSitemapEntry(`/product/${product.slug}`, 0.7, 'weekly'));
  }

  return entries;
}