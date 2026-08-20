import { Breadcrumb, type BreadcrumbItem } from '@components/layout/breadcrumb/breadcrumb';

type CatalogBreadcrumbProps = {
  items?: { label: string; href?: string }[];
  className?: string;
};

export function CatalogBreadcrumb({ items = [], className }: CatalogBreadcrumbProps) {
  const crumbs: BreadcrumbItem[] = items
    .filter((item) => item.label)
    .map((item) => (item.href ? { label: item.label, href: item.href } : { label: item.label }));

  return <Breadcrumb items={crumbs} className={className} />;
}