import { AuditAction } from '@prisma/client';
import { prisma } from '@lib/auth/prisma';
import { writeAudit } from '@lib/auth/audit';
import {
  PRODUCT_STATUSES,
  canTransitionTo,
  getPublishReadiness,
  getAllowedTransitions,
  getEffectiveStatus,
  validateSchedule,
  AUDIT_ACTION_FOR_TARGET,
  type ProductStatusValue,
  type PublishReadiness,
} from './lifecycle.types';

export type { ProductStatusValue, PublishReadiness };
export { PRODUCT_STATUSES, getAllowedTransitions, getPublishReadiness, getEffectiveStatus, validateSchedule };

export class LifecycleError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly blockers?: PublishReadiness['blockers'],
  ) {
    super(message);
  }
}

export type ProductLifecycle = {
  status: ProductStatusValue;
  effectiveStatus: ProductStatusValue;
  version: number;
  transitions: ProductStatusValue[];
  readiness: PublishReadiness;
  publishAt: string | null;
  unpublishAt: string | null;
  hasSchedule: boolean;
};

export async function getProductLifecycle(
  tenantId: string,
  productId: string,
): Promise<ProductLifecycle> {
  const product = await prisma.product.findFirst({
    where: { tenantId, id: productId, deletedAt: null },
    select: {
      id: true,
      status: true,
      version: true,
      name: true,
      slug: true,
      publishAt: true,
      unpublishAt: true,
    },
  });
  if (!product) {
    throw new LifecycleError('Producto no encontrado', 404);
  }

  return {
    status: product.status as ProductStatusValue,
    effectiveStatus: getEffectiveStatus(product),
    version: product.version,
    transitions: getAllowedTransitions(product.status),
    readiness: getPublishReadiness(product),
    publishAt: product.publishAt ? product.publishAt.toISOString() : null,
    unpublishAt: product.unpublishAt ? product.unpublishAt.toISOString() : null,
    hasSchedule: Boolean(product.publishAt || product.unpublishAt),
  };
}

export async function transitionProductStatus(
  tenantId: string,
  actor: { id: string; email: string },
  productId: string,
  targetStatus: ProductStatusValue,
  ip?: string | null,
  userAgent?: string | null,
): Promise<{ version: number }> {
  if (!PRODUCT_STATUSES.includes(targetStatus)) {
    throw new LifecycleError('Estado destino inválido', 400);
  }

  const product = await prisma.product.findFirst({
    where: { tenantId, id: productId, deletedAt: null },
    select: {
      id: true,
      status: true,
      version: true,
      name: true,
      slug: true,
      publishAt: true,
      unpublishAt: true,
    },
  });
  if (!product) {
    throw new LifecycleError('Producto no encontrado', 404);
  }

  if (!canTransitionTo(product.status, targetStatus)) {
    throw new LifecycleError(
      `Transición inválida: ${product.status} → ${targetStatus}`,
      400,
    );
  }

  if (targetStatus === 'ACTIVE') {
    const readiness = getPublishReadiness(product);
    if (!readiness.canPublish) {
      throw new LifecycleError(
        'El producto no está listo para publicarse',
        422,
        readiness.blockers,
      );
    }
  }

  // Publicar ahora / archivar cancelan la programación pendiente.
  const clearSchedule = targetStatus === 'ACTIVE' || targetStatus === 'ARCHIVED';
  const result = await prisma.product.updateMany({
    where: { id: product.id, tenantId, version: product.version },
    data: {
      status: targetStatus,
      version: { increment: 1 },
      ...(clearSchedule ? { publishAt: null, unpublishAt: null } : {}),
    },
  });

  if (result.count === 0) {
    throw new LifecycleError(
      'El producto fue modificado por otra sesión. Recargá y reintentá.',
      409,
    );
  }

  await writeAudit({
    action: AUDIT_ACTION_FOR_TARGET[targetStatus] as AuditAction,
    actorId: actor.id,
    actorEmail: actor.email,
    entityType: 'PRODUCT',
    entityId: product.id,
    metadata: {
      from: product.status,
      to: targetStatus,
      version: product.version + 1,
      clearedSchedule: clearSchedule && Boolean(product.publishAt || product.unpublishAt),
    },
    ip,
    userAgent,
  });

  return { version: product.version + 1 };
}

export async function scheduleProductPublication(
  tenantId: string,
  actor: { id: string; email: string },
  productId: string,
  publishAt: Date | null,
  unpublishAt: Date | null,
  ip?: string | null,
  userAgent?: string | null,
): Promise<{ version: number; publishAt: string | null; unpublishAt: string | null }> {
  const validation = validateSchedule(publishAt, unpublishAt);
  if (!validation.valid) {
    throw new LifecycleError(validation.error ?? 'Programación inválida', 400);
  }

  const product = await prisma.product.findFirst({
    where: { tenantId, id: productId, deletedAt: null },
    select: { id: true, status: true, version: true, publishAt: true, unpublishAt: true },
  });
  if (!product) {
    throw new LifecycleError('Producto no encontrado', 404);
  }
  if (product.status === 'ARCHIVED') {
    throw new LifecycleError('Un producto archivado no puede programarse', 400);
  }

  const result = await prisma.product.updateMany({
    where: { id: product.id, tenantId, version: product.version },
    data: { publishAt, unpublishAt, version: { increment: 1 } },
  });

  if (result.count === 0) {
    throw new LifecycleError(
      'El producto fue modificado por otra sesión. Recargá y reintentá.',
      409,
    );
  }

  await writeAudit({
    action: AuditAction.PRODUCT_SCHEDULE,
    actorId: actor.id,
    actorEmail: actor.email,
    entityType: 'PRODUCT',
    entityId: product.id,
    metadata: {
      publishAt: publishAt?.toISOString() ?? null,
      unpublishAt: unpublishAt?.toISOString() ?? null,
      version: product.version + 1,
    },
    ip,
    userAgent,
  });

  return {
    version: product.version + 1,
    publishAt: publishAt?.toISOString() ?? null,
    unpublishAt: unpublishAt?.toISOString() ?? null,
  };
}

export async function cancelProductSchedule(
  tenantId: string,
  actor: { id: string; email: string },
  productId: string,
  ip?: string | null,
  userAgent?: string | null,
): Promise<{ version: number }> {
  const product = await prisma.product.findFirst({
    where: { tenantId, id: productId, deletedAt: null },
    select: { id: true, version: true, publishAt: true, unpublishAt: true },
  });
  if (!product) {
    throw new LifecycleError('Producto no encontrado', 404);
  }
  if (!product.publishAt && !product.unpublishAt) {
    throw new LifecycleError('El producto no tiene programación activa', 400);
  }

  const result = await prisma.product.updateMany({
    where: { id: product.id, tenantId, version: product.version },
    data: { publishAt: null, unpublishAt: null, version: { increment: 1 } },
  });

  if (result.count === 0) {
    throw new LifecycleError(
      'El producto fue modificado por otra sesión. Recargá y reintentá.',
      409,
    );
  }

  await writeAudit({
    action: AuditAction.PRODUCT_CANCEL_SCHEDULE,
    actorId: actor.id,
    actorEmail: actor.email,
    entityType: 'PRODUCT',
    entityId: product.id,
    metadata: {
      publishAt: product.publishAt?.toISOString() ?? null,
      unpublishAt: product.unpublishAt?.toISOString() ?? null,
      version: product.version + 1,
    },
    ip,
    userAgent,
  });

  return { version: product.version + 1 };
}