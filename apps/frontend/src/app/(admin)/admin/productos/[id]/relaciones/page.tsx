import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { requirePermission } from '@lib/auth';
import { PERMISSIONS } from '@lib/auth/rbac';
import { getTenantId } from '@lib/auth/tenant';
import { prisma } from '@lib/auth/prisma';
import { listProductRelations } from '@lib/products/relations';
import { RelationsManager } from '@components/admin/relations/relations-manager';

export const metadata: Metadata = {
  title: 'Relaciones | Admin',
  robots: { index: false, follow: false },
};

export default async function AdminProductRelationsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePermission(PERMISSIONS.PRODUCTS_MANAGE);

  const { id } = await params;
  const tenantId = getTenantId();

  const product = await prisma.product.findFirst({
    where: { tenantId, id, deletedAt: null },
    select: { id: true, name: true, slug: true, status: true },
  });
  if (!product) {
    notFound();
  }

  const groups = await listProductRelations(tenantId, product.id);

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/productos"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Productos
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground">
          Relaciones — {product.name}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Productos relacionados, alternativos y complementarios. Slug: {product.slug}
        </p>
      </div>

      <RelationsManager productId={product.id} productName={product.name} initialGroups={groups} />
    </div>
  );
}