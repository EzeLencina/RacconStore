import type { Metadata } from 'next';
import { requirePermission } from '@lib/auth';
import { PERMISSIONS } from '@lib/auth/rbac';
import { COLLECTION_FIELDS } from '@lib/catalog/form-fields';
import { CATALOG_STATUSES, COLLECTION_TYPES } from '@lib/catalog/catalog';
import { CatalogManager } from '@components/admin/catalog/catalog-manager';

export const metadata: Metadata = {
  title: 'Colecciones | Admin',
  robots: { index: false, follow: false },
};

export default async function AdminCollectionsPage() {
  await requirePermission(PERMISSIONS.PRODUCTS_MANAGE);

  return (
    <CatalogManager
      title="Colecciones"
      description="Agrupá productos en colecciones para listados y promociones."
      endpoint="/api/admin/collections"
      statusOptions={CATALOG_STATUSES}
      fields={COLLECTION_FIELDS}
      emptyMessage="No hay colecciones creadas todavía."
      showTypeFilter
      typeOptions={COLLECTION_TYPES}
      typeFilterLabel="Tipo"
    />
  );
}