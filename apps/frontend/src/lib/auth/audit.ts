import { AuditAction, Prisma } from '@prisma/client';
import { prisma } from './prisma';
import { getTenantId } from './tenant';

export type AuditEntry = {
  action: AuditAction;
  actorId?: string | null;
  actorEmail?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
  ip?: string | null;
  userAgent?: string | null;
};

export async function writeAudit(entry: AuditEntry): Promise<void> {
  await prisma.auditLog.create({
    data: {
      tenantId: getTenantId(),
      action: entry.action,
      actorId: entry.actorId ?? undefined,
      actorEmail: entry.actorEmail ?? undefined,
      entityType: entry.entityType ?? undefined,
      entityId: entry.entityId ?? undefined,
      metadata: entry.metadata ? (entry.metadata as Prisma.InputJsonValue) : undefined,
      ip: entry.ip ?? undefined,
      userAgent: entry.userAgent ?? undefined,
    },
  });
}