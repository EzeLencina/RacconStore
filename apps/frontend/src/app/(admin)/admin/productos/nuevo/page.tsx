import type { Metadata } from 'next';
import Link from 'next/link';
import { requirePermission } from '@lib/auth';
import { PERMISSIONS } from '@lib/auth/rbac';
import { getTenantId } from '@lib/auth/tenant';
import { prisma } from '@lib/auth/prisma';
import { ProductForm } from '@components/admin/products/product-form';

export const metadata: Metadata = {
  title: 'Nuevo producto | Admin',
  robots: { index: false, follow: false },
};

export default async function AdminNewProductPage() {
  await requirePermission(PERMISSIONS.PRODUCTS_MANAGE);

  const tenantId = getTenantId();
  const brands = await prisma.brand.findMany({
    where: { tenantId, deletedAt: null },
    orderBy: { name: 'asc' },
    select: { id: true, name: true },
  });

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/productos"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          ← Productos
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground">Nuevo producto</h1>
      </div>

      <ProductForm brands={brands} />
    </div>
  );
}