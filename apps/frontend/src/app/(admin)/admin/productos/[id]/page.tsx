import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { notFound } from 'next/navigation';
import { requirePermission } from '@lib/auth';
import { PERMISSIONS } from '@lib/auth/rbac';
import { getTenantId } from '@lib/auth/tenant';
import { prisma } from '@lib/auth/prisma';
import { isProductFeatured } from '@lib/products/featured';
import { STATUS_LABELS, getAllowedTransitions, getPublishReadiness, getEffectiveStatus } from '@lib/products/lifecycle.types';
import { FeaturedToggle } from '@components/admin/featured';
import { LifecycleActions, type LifecycleActionsProps } from '@components/admin/lifecycle';

export const metadata: Metadata = {
  title: 'Producto | Admin',
  robots: { index: false, follow: false },
};

export default async function AdminProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePermission(PERMISSIONS.PRODUCTS_MANAGE);

  const { id } = await params;
  const tenantId = getTenantId();

  const product = await prisma.product.findFirst({
    where: { tenantId, id, deletedAt: null },
    select: {
      id: true,
      name: true,
      slug: true,
      status: true,
      version: true,
      visibility: true,
      productType: true,
      publishAt: true,
      unpublishAt: true,
      createdAt: true,
    },
  });
  if (!product) {
    notFound();
  }

  const featured = await isProductFeatured(tenantId, product.id);
  const transitions = getAllowedTransitions(product.status);
  const readiness = getPublishReadiness(product);
  const effectiveStatus = getEffectiveStatus(product);

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/productos"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          ← Productos
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground">{product.name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">Slug: {product.slug}</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card">
          <div className="border-b border-border px-5 py-3">
            <h2 className="text-sm font-medium text-foreground">Ciclo de vida</h2>
          </div>
          <div className="space-y-4 px-5 py-4">
            <LifecycleActions
              productId={product.id}
              initialStatus={product.status as LifecycleActionsProps['initialStatus']}
              initialVersion={product.version}
              initialTransitions={transitions}
              initialReadiness={readiness}
              initialEffectiveStatus={effectiveStatus}
              initialPublishAt={product.publishAt ? product.publishAt.toISOString() : null}
              initialUnpublishAt={product.unpublishAt ? product.unpublishAt.toISOString() : null}
            />
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card">
          <div className="border-b border-border px-5 py-3">
            <h2 className="text-sm font-medium text-foreground">Promoción</h2>
          </div>
          <div className="space-y-4 px-5 py-4">
            <p className="text-sm text-muted-foreground">
              Los productos destacados aparecen en la Home y en /catalogo/destacados. Solo los productos
              publicables (estado ACTIVE y visibilidad PUBLIC) se muestran al público.
            </p>
            <FeaturedToggle productId={product.id} initiallyFeatured={featured} />
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <h2 className="text-sm font-medium text-foreground">Relaciones</h2>
          <Link
            href={`/admin/productos/${product.id}/relaciones`}
            className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
          >
            Gestionar <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}