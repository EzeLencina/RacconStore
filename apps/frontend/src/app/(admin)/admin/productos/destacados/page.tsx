import type { Metadata } from 'next';
import Link from 'next/link';
import { requirePermission } from '@lib/auth';
import { PERMISSIONS } from '@lib/auth/rbac';
import { getTenantId } from '@lib/auth/tenant';
import { listFeaturedAdmin } from '@lib/products/featured';
import { FeaturedManager } from '@components/admin/featured';

export const metadata: Metadata = {
  title: 'Destacados | Admin',
  robots: { index: false, follow: false },
};

export default async function AdminFeaturedPage() {
  await requirePermission(PERMISSIONS.PRODUCTS_MANAGE);

  const rows = await listFeaturedAdmin(getTenantId());

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/productos"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          ← Productos
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground">Productos destacados</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Administrá qué productos se muestran como destacados y su orden.
        </p>
      </div>

      <FeaturedManager initialRows={rows} />
    </div>
  );
}