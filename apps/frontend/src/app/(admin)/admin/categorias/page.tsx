import type { Metadata } from 'next';
import { requirePermission } from '@lib/auth';
import { PERMISSIONS } from '@lib/auth/rbac';
import { CATEGORY_FIELDS } from '@lib/catalog/form-fields';
import { CATALOG_STATUSES } from '@lib/catalog/catalog';
import { CatalogManager } from '@components/admin/catalog/catalog-manager';

export const metadata: Metadata = {
  title: 'Categorías | Admin',
  robots: { index: false, follow: false },
};

export default async function AdminCategoriesPage() {
  await requirePermission(PERMISSIONS.PRODUCTS_MANAGE);

  return (
    <CatalogManager
      title="Categorías"
      description="Organizá el catálogo en categorías jerárquicas."
      endpoint="/api/admin/categories"
      statusOptions={CATALOG_STATUSES}
      fields={CATEGORY_FIELDS}
      emptyMessage="No hay categorías creadas todavía."
    />
  );
}