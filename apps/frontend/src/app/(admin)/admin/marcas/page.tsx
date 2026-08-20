import type { Metadata } from 'next';
import { requirePermission } from '@lib/auth';
import { PERMISSIONS } from '@lib/auth/rbac';
import { BRAND_FIELDS } from '@lib/catalog/form-fields';
import { BRAND_STATUSES } from '@lib/catalog/catalog';
import { CatalogManager } from '@components/admin/catalog/catalog-manager';

export const metadata: Metadata = {
  title: 'Marcas | Admin',
  robots: { index: false, follow: false },
};

export default async function AdminBrandsPage() {
  await requirePermission(PERMISSIONS.PRODUCTS_MANAGE);

  return (
    <CatalogManager
      title="Marcas"
      description="Gestioná las marcas del catálogo."
      endpoint="/api/admin/brands"
      statusOptions={BRAND_STATUSES}
      fields={BRAND_FIELDS}
      emptyMessage="No hay marcas creadas todavía."
    />
  );
}