export const PRODUCT_STATUSES = ['DRAFT', 'ACTIVE', 'INACTIVE', 'ARCHIVED'] as const;
export type ProductStatusValue = (typeof PRODUCT_STATUSES)[number];

/**
 * Valid transitions (mirror of the Product domain: product-status.vo.ts).
 * DRAFT -> ACTIVE | ARCHIVED
 * ACTIVE -> INACTIVE | ARCHIVED
 * INACTIVE -> ACTIVE | ARCHIVED
 * ARCHIVED -> DRAFT (restore)
 */
export const STATUS_TRANSITIONS: Record<ProductStatusValue, ProductStatusValue[]> = {
  DRAFT: ['ACTIVE', 'ARCHIVED'],
  ACTIVE: ['INACTIVE', 'ARCHIVED'],
  INACTIVE: ['ACTIVE', 'ARCHIVED'],
  ARCHIVED: ['DRAFT'],
};

export const STATUS_LABELS: Record<ProductStatusValue, string> = {
  DRAFT: 'Borrador',
  ACTIVE: 'Activo',
  INACTIVE: 'Inactivo',
  ARCHIVED: 'Archivado',
};

export const AUDIT_ACTION_FOR_TARGET: Record<ProductStatusValue, string> = {
  DRAFT: 'PRODUCT_RESTORE',
  ACTIVE: 'PRODUCT_PUBLISH',
  INACTIVE: 'PRODUCT_DEACTIVATE',
  ARCHIVED: 'PRODUCT_ARCHIVE',
};

export type PublishBlocker = {
  code: string;
  message: string;
};

export type PublishReadiness = {
  canPublish: boolean;
  blockers: PublishBlocker[];
};

/**
 * Reuses the existing Product domain publishability rule (ProductCanBePublished):
 * status DRAFT or INACTIVE, and non-empty name + slug.
 * No extra commercial requirements are invented.
 */
export function getPublishReadiness(product: {
  status: string;
  name: string | null;
  slug: string;
}): PublishReadiness {
  const blockers: PublishBlocker[] = [];

  if (product.status !== 'DRAFT' && product.status !== 'INACTIVE') {
    blockers.push({
      code: 'INVALID_STATUS',
      message: 'Solo un producto en estado DRAFT o INACTIVE puede publicarse.',
    });
  }
  if (!product.name || product.name.trim().length === 0) {
    blockers.push({ code: 'MISSING_NAME', message: 'El producto no tiene nombre.' });
  }
  if (!product.slug || product.slug.trim().length === 0) {
    blockers.push({ code: 'MISSING_SLUG', message: 'El producto no tiene slug.' });
  }

  return { canPublish: blockers.length === 0, blockers };
}

export function getAllowedTransitions(status: string): ProductStatusValue[] {
  return STATUS_TRANSITIONS[status as ProductStatusValue] ?? [];
}

export function canTransitionTo(current: string, target: string): boolean {
  return getAllowedTransitions(current).includes(target as ProductStatusValue);
}

// ── Scheduled publication (deterministic, computed at read time) ──────────

export type ScheduleWindow = {
  status: string;
  publishAt: Date | string | null;
  unpublishAt: Date | string | null;
};

export type ScheduleValidation = {
  valid: boolean;
  error?: string;
};

export function validateSchedule(
  publishAt: Date | string | null,
  unpublishAt: Date | string | null,
): ScheduleValidation {
  const toTime = (value: Date | string | null) =>
    value === null ? null : new Date(value).getTime();

  const publish = toTime(publishAt);
  const unpublish = toTime(unpublishAt);

  if (Number.isNaN(publish) || Number.isNaN(unpublish)) {
    return { valid: false, error: 'Fechas de programación inválidas.' };
  }
  if (unpublish !== null && publish !== null && unpublish <= publish) {
    return { valid: false, error: 'unpublishAt debe ser posterior a publishAt (UTC).' };
  }
  return { valid: true };
}

/**
 * Deterministic effective status for a schedule window (UTC internally).
 * A future publishAt keeps the product unpublished until it passes;
 * an unpublishAt makes the product inactive once it passes.
 */
export function getEffectiveStatus(
  product: ScheduleWindow,
  now: Date = new Date(),
): ProductStatusValue {
  const publishAt = product.publishAt ? new Date(product.publishAt).getTime() : null;
  const unpublishAt = product.unpublishAt ? new Date(product.unpublishAt).getTime() : null;
  const time = now.getTime();

  if (product.status === 'ARCHIVED') return 'ARCHIVED';

  if (product.status === 'ACTIVE') {
    if (unpublishAt !== null && time >= unpublishAt) return 'INACTIVE';
    if (publishAt !== null && time < publishAt) return 'DRAFT';
    return 'ACTIVE';
  }

  if (product.status === 'DRAFT' || product.status === 'INACTIVE') {
    if (publishAt !== null && time >= publishAt) {
      if (unpublishAt !== null && time >= unpublishAt) return 'INACTIVE';
      return 'ACTIVE';
    }
    return product.status === 'INACTIVE' ? 'INACTIVE' : 'DRAFT';
  }

  return product.status as ProductStatusValue;
}

export function isProductPublicable(
  product: ScheduleWindow & { visibility: string; deletedAt?: Date | null },
  now: Date = new Date(),
): boolean {
  return (
    product.deletedAt === null &&
    product.visibility === 'PUBLIC' &&
    getEffectiveStatus(product, now) === 'ACTIVE'
  );
}