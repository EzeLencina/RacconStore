import { AuditAction, Prisma } from '@prisma/client';
import { prisma } from '@lib/auth/prisma';
import { writeAudit } from '@lib/auth/audit';
import {
  RELATION_TYPES,
  toRelationCard,
  type ProductRelationTypeValue,
  type RelationCard,
} from './relations.types';
import { isProductPublicable } from './lifecycle.types';

export { RELATION_TYPES, toRelationCard };
export type { ProductRelationTypeValue, RelationCard };

export type RelationTarget = {
  relationId: string;
  productId: string;
  name: string;
  slug: string;
  status: string;
  position: number;
};

export class ProductRelationError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
  }
}

export async function listProductRelations(
  tenantId: string,
  productId: string,
): Promise<{ type: ProductRelationTypeValue; items: RelationTarget[] }[]> {
  const rows = await prisma.productRelation.findMany({
    where: { tenantId, sourceProductId: productId },
    include: { targetProduct: true },
    orderBy: [{ type: 'asc' }, { position: 'asc' }],
  });

  const byType = new Map<ProductRelationTypeValue, RelationTarget[]>();
  for (const row of rows) {
    const type = row.type as ProductRelationTypeValue;
    if (!byType.has(type)) byType.set(type, []);
    byType.get(type)!.push({
      relationId: row.id,
      productId: row.targetProductId,
      name: row.targetProduct.name,
      slug: row.targetProduct.slug,
      status: row.targetProduct.status,
      position: row.position,
    });
  }

  return (Object.keys(RELATION_TYPES) as ProductRelationTypeValue[]).map((type) => ({
    type,
    items: byType.get(type) ?? [],
  }));
}

export async function addProductRelation(
  tenantId: string,
  actor: { id: string; email: string },
  sourceProductId: string,
  targetProductId: string,
  type: ProductRelationTypeValue,
  ip?: string | null,
  userAgent?: string | null,
): Promise<RelationTarget> {
  if (sourceProductId === targetProductId) {
    throw new ProductRelationError('Un producto no puede relacionarse consigo mismo', 400);
  }

  const source = await prisma.product.findFirst({
    where: { tenantId, id: sourceProductId, deletedAt: null },
  });
  if (!source) {
    throw new ProductRelationError('Producto de origen no encontrado', 404);
  }

  const target = await prisma.product.findFirst({
    where: { tenantId, id: targetProductId, deletedAt: null },
  });
  if (!target) {
    throw new ProductRelationError('Producto de destino no encontrado', 404);
  }

  const existing = await prisma.productRelation.findUnique({
    where: {
      tenantId_sourceProductId_targetProductId_type: {
        tenantId,
        sourceProductId,
        targetProductId,
        type,
      },
    },
  });
  if (existing) {
    throw new ProductRelationError('La relación ya existe', 409);
  }

  const last = await prisma.productRelation.findFirst({
    where: { tenantId, sourceProductId, type },
    orderBy: { position: 'desc' },
  });

  const relation = await prisma.productRelation.create({
    data: {
      tenantId,
      sourceProductId,
      targetProductId,
      type,
      position: (last?.position ?? -1) + 1,
    },
  });

  await writeAudit({
    action: AuditAction.PRODUCT_RELATION_ADD,
    actorId: actor.id,
    actorEmail: actor.email,
    entityType: 'PRODUCT_RELATION',
    entityId: relation.id,
    metadata: { sourceProductId, targetProductId, type, position: relation.position },
    ip,
    userAgent,
  });

  return {
    relationId: relation.id,
    productId: targetProductId,
    name: target.name,
    slug: target.slug,
    status: target.status,
    position: relation.position,
  };
}

export async function removeProductRelation(
  tenantId: string,
  actor: { id: string; email: string },
  sourceProductId: string,
  relationId: string,
  ip?: string | null,
  userAgent?: string | null,
): Promise<void> {
  const relation = await prisma.productRelation.findFirst({
    where: { tenantId, id: relationId, sourceProductId },
  });
  if (!relation) {
    throw new ProductRelationError('Relación no encontrada', 404);
  }

  await prisma.productRelation.delete({ where: { id: relation.id } });

  await writeAudit({
    action: AuditAction.PRODUCT_RELATION_REMOVE,
    actorId: actor.id,
    actorEmail: actor.email,
    entityType: 'PRODUCT_RELATION',
    entityId: relation.id,
    metadata: { sourceProductId, targetProductId: relation.targetProductId, type: relation.type },
    ip,
    userAgent,
  });
}

export async function reorderProductRelations(
  tenantId: string,
  actor: { id: string; email: string },
  sourceProductId: string,
  type: ProductRelationTypeValue,
  orderedIds: string[],
  ip?: string | null,
  userAgent?: string | null,
): Promise<void> {
  const rows = await prisma.productRelation.findMany({
    where: { tenantId, sourceProductId, type },
  });
  const byId = new Map(rows.map((row) => [row.id, row]));

  for (const row of rows) {
    if (!orderedIds.includes(row.id)) {
      throw new ProductRelationError('La lista de reorden no incluye todas las relaciones', 400);
    }
  }

  await prisma.$transaction(
    orderedIds.map((id, index) => {
      const row = byId.get(id);
      if (!row) {
        throw new ProductRelationError('Relación inválida en el reorden', 400);
      }
      return prisma.productRelation.update({
        where: { id: row.id },
        data: { position: index },
      });
    }),
  );

  await writeAudit({
    action: AuditAction.PRODUCT_RELATION_REORDER,
    actorId: actor.id,
    actorEmail: actor.email,
    entityType: 'PRODUCT_RELATION',
    entityId: sourceProductId,
    metadata: { sourceProductId, type, order: orderedIds },
    ip,
    userAgent,
  });
}

export async function searchProducts(
  tenantId: string,
  query: string,
  page: number,
  pageSize: number,
  excludeProductId?: string,
): Promise<{ items: RelationCard[]; total: number; page: number; pageSize: number }> {
  const q = query.trim();
  const where: Prisma.ProductWhereInput = {
    tenantId,
    deletedAt: null,
    ...(excludeProductId ? { id: { not: excludeProductId } } : {}),
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { slug: { contains: q, mode: 'insensitive' } },
          ],
        }
      : {}),
  };

  const [total, products] = await prisma.$transaction([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return {
    items: products.map((p) => toRelationCard(p)),
    total,
    page,
    pageSize,
  };
}

export async function getProductRelationsForPdp(
  tenantId: string,
  slug: string,
): Promise<{ related: RelationCard[]; complementary: RelationCard[] }> {
  const product = await prisma.product.findFirst({
    where: {
      tenantId,
      slug,
      deletedAt: null,
      status: 'ACTIVE',
      visibility: 'PUBLIC',
    },
  });
  if (!product || !isProductPublicable(product)) {
    return { related: [], complementary: [] };
  }

  const rows = await prisma.productRelation.findMany({
    where: { tenantId, sourceProductId: product.id },
    include: { targetProduct: true },
    orderBy: [{ type: 'asc' }, { position: 'asc' }],
  });

  const related: RelationCard[] = [];
  const complementary: RelationCard[] = [];

  for (const row of rows) {
    const target = row.targetProduct;
    if (!isProductPublicable(target)) {
      continue;
    }
    const card = toRelationCard(target);
    if (row.type === 'COMPLEMENTARY') {
      complementary.push(card);
    } else {
      related.push(card);
    }
  }

  return { related, complementary };
}