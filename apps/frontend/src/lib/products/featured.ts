import { AuditAction } from '@prisma/client';
import { prisma } from '@lib/auth/prisma';
import { writeAudit } from '@lib/auth/audit';
import { toRelationCard, type RelationCard } from './relations.types';
import { isProductPublicable } from './lifecycle.types';

export const FEATURED_COLLECTION_SLUG = 'destacados';

export class FeaturedError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
  }
}

export type FeaturedAdminRow = {
  productId: string;
  name: string;
  slug: string;
  status: string;
  displayOrder: number;
};

async function ensureFeaturedCollection(tenantId: string): Promise<{ id: string }> {
  return prisma.collection.upsert({
    where: { tenantId_slug: { tenantId, slug: FEATURED_COLLECTION_SLUG } },
    update: { type: 'FEATURED' },
    create: {
      tenantId,
      name: 'Destacados',
      slug: FEATURED_COLLECTION_SLUG,
      type: 'FEATURED',
      status: 'ACTIVE',
      visibility: 'PUBLIC',
    },
  });
}

async function getFeaturedCollection(tenantId: string) {
  return prisma.collection.findFirst({
    where: { tenantId, slug: FEATURED_COLLECTION_SLUG },
  });
}

export async function isProductFeatured(tenantId: string, productId: string): Promise<boolean> {
  const collection = await getFeaturedCollection(tenantId);
  if (!collection) return false;
  const row = await prisma.productCollection.findUnique({
    where: {
      tenantId_productId_collectionId: {
        tenantId,
        productId,
        collectionId: collection.id,
      },
    },
  });
  return Boolean(row);
}

export async function listFeaturedProducts(tenantId: string): Promise<RelationCard[]> {
  const collection = await getFeaturedCollection(tenantId);
  if (!collection) return [];

  const rows = await prisma.productCollection.findMany({
    where: { tenantId, collectionId: collection.id },
    include: { product: true },
    orderBy: { displayOrder: 'asc' },
  });

  return rows
    .filter((row) => isProductPublicable(row.product))
    .map((row) => toRelationCard(row.product));
}

export async function listFeaturedAdmin(tenantId: string): Promise<FeaturedAdminRow[]> {
  const collection = await getFeaturedCollection(tenantId);
  if (!collection) return [];

  const rows = await prisma.productCollection.findMany({
    where: { tenantId, collectionId: collection.id },
    include: { product: true },
    orderBy: { displayOrder: 'asc' },
  });

  return rows.map((row) => ({
    productId: row.productId,
    name: row.product.name,
    slug: row.product.slug,
    status: row.product.status,
    displayOrder: row.displayOrder,
  }));
}

export async function setProductFeatured(
  tenantId: string,
  actor: { id: string; email: string },
  productId: string,
  featured: boolean,
  ip?: string | null,
  userAgent?: string | null,
): Promise<void> {
  const product = await prisma.product.findFirst({
    where: { tenantId, id: productId, deletedAt: null },
  });
  if (!product) {
    throw new FeaturedError('Producto no encontrado', 404);
  }

  const collection = await ensureFeaturedCollection(tenantId);
  const existing = await prisma.productCollection.findUnique({
    where: {
      tenantId_productId_collectionId: {
        tenantId,
        productId,
        collectionId: collection.id,
      },
    },
  });

  if (featured) {
    if (!existing) {
      const max = await prisma.productCollection.aggregate({
        _max: { displayOrder: true },
        where: { tenantId, collectionId: collection.id },
      });
      await prisma.productCollection.create({
        data: {
          tenantId,
          productId,
          collectionId: collection.id,
          displayOrder: (max._max.displayOrder ?? -1) + 1,
        },
      });
    }
    await writeAudit({
      action: AuditAction.PRODUCT_FEATURED_ADD,
      actorId: actor.id,
      actorEmail: actor.email,
      entityType: 'PRODUCT',
      entityId: productId,
      metadata: { featured: true },
      ip,
      userAgent,
    });
  } else {
    if (existing) {
      await prisma.productCollection.deleteMany({
        where: { tenantId, productId, collectionId: collection.id },
      });
    }
    await writeAudit({
      action: AuditAction.PRODUCT_FEATURED_REMOVE,
      actorId: actor.id,
      actorEmail: actor.email,
      entityType: 'PRODUCT',
      entityId: productId,
      metadata: { featured: false },
      ip,
      userAgent,
    });
  }
}

export async function reorderFeaturedProducts(
  tenantId: string,
  actor: { id: string; email: string },
  orderedProductIds: string[],
  ip?: string | null,
  userAgent?: string | null,
): Promise<void> {
  const collection = await getFeaturedCollection(tenantId);
  if (!collection) {
    throw new FeaturedError('No existe la colección de destacados', 404);
  }

  const rows = await prisma.productCollection.findMany({
    where: { tenantId, collectionId: collection.id },
  });
  const byProductId = new Map(rows.map((row) => [row.productId, row]));

  for (const row of rows) {
    if (!orderedProductIds.includes(row.productId)) {
      throw new FeaturedError('La lista de reorden no incluye todos los destacados', 400);
    }
  }

  await prisma.$transaction(
    orderedProductIds.map((productId, index) => {
      const row = byProductId.get(productId);
      if (!row) {
        throw new FeaturedError('Producto destacado inválido en el reorden', 400);
      }
      return prisma.productCollection.update({
        where: {
          tenantId_productId_collectionId: {
            tenantId,
            productId,
            collectionId: collection.id,
          },
        },
        data: { displayOrder: index },
      });
    }),
  );

  await writeAudit({
    action: AuditAction.PRODUCT_FEATURED_REORDER,
    actorId: actor.id,
    actorEmail: actor.email,
    entityType: 'COLLECTION',
    entityId: collection.id,
    metadata: { order: orderedProductIds },
    ip,
    userAgent,
  });
}