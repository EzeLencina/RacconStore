import { Breadcrumb } from '@components/layout';
import type { PDPProduct } from '@lib/storefront/types';

type ProductBreadcrumbsProps = {
  product: PDPProduct;
  className?: string;
};

export function ProductBreadcrumbs({ product, className }: ProductBreadcrumbsProps) {
  const items = [
    { label: product.category, href: `/categoria/${product.categorySlug}` },
    ...(product.subcategory ? [{ label: product.subcategory, href: `/categoria/${product.categorySlug}/${product.subcategorySlug}` }] : []),
    { label: product.name },
  ];

  return <Breadcrumb items={items} className={className} />;
}
