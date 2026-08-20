import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { requirePermission } from '@lib/auth';
import { PERMISSIONS } from '@lib/auth/rbac';
import { getTenantId } from '@lib/auth/tenant';
import { prisma } from '@lib/auth/prisma';
import { getProductEditorPayload } from '@lib/products/crud';
import { ProductEditor, type EditorPayload, type EditorRef } from '@components/admin/products/product-editor';

export const metadata: Metadata = {
  title: 'Editar producto | Admin',
  robots: { index: false, follow: false },
};

export default async function AdminEditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePermission(PERMISSIONS.PRODUCTS_MANAGE);

  const { id } = await params;
  const tenantId = getTenantId();

  const [payload, brands, categories, collections] = await Promise.all([
    getProductEditorPayload(tenantId, id),
    prisma.brand.findMany({
      where: { tenantId, deletedAt: null },
      orderBy: { name: 'asc' },
      select: { id: true, name: true },
    }),
    prisma.category.findMany({
      where: { tenantId, deletedAt: null },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, slug: true },
    }),
    prisma.collection.findMany({
      where: { tenantId, deletedAt: null },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, slug: true },
    }),
  ]);

  if (!payload) {
    notFound();
  }

  const initial: EditorPayload = {
    ...payload,
    publishAt: payload.publishAt ? payload.publishAt.toISOString() : null,
    unpublishAt: payload.unpublishAt ? payload.unpublishAt.toISOString() : null,
    variants: payload.variants.map((v) => ({
      ...v,
      attributes: Array.isArray(v.attributes)
        ? (v.attributes as Array<{ key: string; value: string | number | boolean }>)
        : [],
    })),
    categories: payload.categories as EditorRef[],
    collections: payload.collections as EditorRef[],
  };

  return (
    <ProductEditor
      initial={initial}
      brands={brands}
      allCategories={categories as EditorRef[]}
      allCollections={collections as EditorRef[]}
    />
  );
}