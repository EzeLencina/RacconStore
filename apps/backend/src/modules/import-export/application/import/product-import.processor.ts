import type { ParsedRow } from '../csv/csv.util';
import {
  PRODUCT_TYPES,
  PRODUCT_STATUSES,
  PRODUCT_VISIBILITIES,
  PRODUCT_CONDITIONS,
  VARIANT_STATUSES,
} from '../../constants/import-export.constants';
import type { ImportAction, NormalizedImportRow } from '../../types/import-export.types';

export type ExistingProduct = {
  slug: string;
  name: string;
  status: string;
  visibility: string;
  productType: string;
  condition: string;
  warrantyMonths: number | null;
  shortDescription: string | null;
  description: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
};

export type ExistingVariant = {
  sku: string;
  name: string | null;
  barcode: string | null;
  status: string;
  isDefault: boolean;
  attributes: unknown;
  product: ExistingProduct;
};

export type TypedImportRow = {
  slug: string;
  name: string | null;
  shortDescription: string | null;
  description: string | null;
  productType: string | null;
  status: string | null;
  visibility: string | null;
  condition: string | null;
  warrantyMonths: number | null;
  seoTitle: string | null;
  seoDescription: string | null;
  sku: string;
  variantName: string | null;
  barcode: string | null;
  variantStatus: string | null;
  isDefault: boolean | null;
  attributes: unknown;
  costAmount: number | null;
  listAmount: number | null;
  saleAmount: number | null;
  promotionalAmount: number | null;
  promotionalStartsAt: Date | null;
  promotionalEndsAt: Date | null;
  onHand: number | null;
  minimumStock: number | null;
  hasPriceData: boolean;
  hasInventoryData: boolean;
};

export const STATUS_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ['ACTIVE', 'ARCHIVED'],
  ACTIVE: ['INACTIVE', 'ARCHIVED'],
  INACTIVE: ['ACTIVE', 'ARCHIVED'],
  ARCHIVED: ['DRAFT'],
};

function parseInteger(value: string | null): { ok: true; value: number | null } | { ok: false; message: string } {
  if (value === null || value === '') return { ok: true, value: null };
  if (!/^-?\d+$/.test(value)) {
    return { ok: false, message: 'debe ser un entero' };
  }
  const parsed = parseInt(value, 10);
  if (parsed < 0) return { ok: false, message: 'no puede ser negativo' };
  return { ok: true, value: parsed };
}

function parseDate(value: string | null): { ok: true; value: Date | null } | { ok: false; message: string } {
  if (value === null || value === '') return { ok: true, value: null };
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return { ok: false, message: 'fecha inválida (usá formato ISO UTC)' };
  }
  return { ok: true, value: parsed };
}

function parseAttributes(value: string | null): { ok: true; value: unknown } | { ok: false; message: string } {
  if (value === null || value === '') return { ok: true, value: null };
  try {
    return { ok: true, value: JSON.parse(value) };
  } catch {
    return { ok: false, message: 'attributes debe ser JSON válido' };
  }
}

function parseBoolean(value: string | null): { ok: true; value: boolean | null } | { ok: false; message: string } {
  if (value === null || value === '') return { ok: true, value: null };
  if (value === 'true' || value === 'TRUE' || value === '1') return { ok: true, value: true };
  if (value === 'false' || value === 'FALSE' || value === '0') return { ok: true, value: false };
  return { ok: false, message: 'isDefault debe ser true o false' };
}

function parseEnum(
  value: string | null,
  allowed: readonly string[],
  label: string,
): { ok: true; value: string | null } | { ok: false; message: string } {
  if (value === null || value === '') return { ok: true, value: null };
  if (!allowed.includes(value)) {
    return { ok: false, message: `${label} inválido (${allowed.join('/')})` };
  }
  return { ok: true, value };
}

function sameString(a: string | null, b: string | null): boolean {
  if (a === null && b === null) return true;
  if (a === null || b === null) return false;
  return String(a) === String(b);
}

function validateTransition(
  field: string,
  current: string,
  target: string | null,
): string | null {
  if (target === null || target === current) return null;
  const allowed = STATUS_TRANSITIONS[current];
  if (!allowed || !allowed.includes(target)) {
    return `transición de estado inválida para ${field}: ${current} → ${target}`;
  }
  return null;
}

/**
 * Validates and normalizes a CSV row against existing DB records
 * (pure logic, no DB access). Natural keys: slug (product), sku (variant).
 */
export function normalizeRow(
  row: ParsedRow,
  rowNumber: number,
  existing: { product?: ExistingProduct; variant?: ExistingVariant },
): NormalizedImportRow {
  const errors: string[] = [];
  const raw = row;
  const value = (column: string): string | null => {
    const v = raw[column];
    if (v === undefined || v === null || v === '') return null;
    const trimmed = String(v).trim();
    return trimmed === '' ? null : trimmed;
  };

  const sku = value('sku');
  const slug = value('slug');
  const name = value('name');

  if (!sku) {
    errors.push('sku es obligatorio');
  }
  if (!existing.variant && !slug) {
    errors.push('slug es obligatorio al crear una variante nueva');
  }
  if (!existing.variant && !existing.product && !name) {
    errors.push('name es obligatorio al crear un producto nuevo');
  }

  const typed: TypedImportRow = {
    slug: existing.variant ? existing.variant.product.slug : (slug ?? ''),
    name,
    shortDescription: value('shortDescription'),
    description: value('description'),
    productType: null,
    status: null,
    visibility: null,
    condition: null,
    warrantyMonths: null,
    seoTitle: value('seoTitle'),
    seoDescription: value('seoDescription'),
    sku: sku ?? '',
    variantName: value('variantName'),
    barcode: value('barcode'),
    variantStatus: null,
    isDefault: null,
    attributes: null,
    costAmount: null,
    listAmount: null,
    saleAmount: null,
    promotionalAmount: null,
    promotionalStartsAt: null,
    promotionalEndsAt: null,
    onHand: null,
    minimumStock: null,
    hasPriceData: false,
    hasInventoryData: false,
  };

  const enumResult = parseEnum(value('productType'), PRODUCT_TYPES, 'productType');
  if (enumResult.ok) typed.productType = enumResult.value;
  else errors.push(enumResult.message);

  const statusResult = parseEnum(value('status'), PRODUCT_STATUSES, 'status');
  if (statusResult.ok) typed.status = statusResult.value;
  else errors.push(statusResult.message);

  const visibilityResult = parseEnum(value('visibility'), PRODUCT_VISIBILITIES, 'visibility');
  if (visibilityResult.ok) typed.visibility = visibilityResult.value;
  else errors.push(visibilityResult.message);

  const conditionResult = parseEnum(value('condition'), PRODUCT_CONDITIONS, 'condition');
  if (conditionResult.ok) typed.condition = conditionResult.value;
  else errors.push(conditionResult.message);

  const variantStatusResult = parseEnum(value('variantStatus'), VARIANT_STATUSES, 'variantStatus');
  if (variantStatusResult.ok) typed.variantStatus = variantStatusResult.value;
  else errors.push(variantStatusResult.message);

  const warranty = parseInteger(value('warrantyMonths'));
  if (warranty.ok) typed.warrantyMonths = warranty.value;
  else errors.push(`warrantyMonths ${warranty.message}`);

  for (const column of ['costAmount', 'listAmount', 'saleAmount', 'promotionalAmount', 'onHand', 'minimumStock'] as const) {
    const parsed = parseInteger(value(column));
    if (parsed.ok) {
      (typed as Record<string, unknown>)[column] = parsed.value;
    } else {
      errors.push(`${column} ${parsed.message}`);
    }
  }
  typed.hasPriceData = ['costAmount', 'listAmount', 'saleAmount', 'promotionalAmount', 'promotionalStartsAt', 'promotionalEndsAt'].some(
    (column) => value(column) !== null,
  );
  typed.hasInventoryData = ['onHand', 'minimumStock'].some((column) => value(column) !== null);

  const startsAt = parseDate(value('promotionalStartsAt'));
  const endsAt = parseDate(value('promotionalEndsAt'));
  if (startsAt.ok) typed.promotionalStartsAt = startsAt.value;
  else errors.push(`promotionalStartsAt ${startsAt.message}`);
  if (endsAt.ok) typed.promotionalEndsAt = endsAt.value;
  else errors.push(`promotionalEndsAt ${endsAt.message}`);
  if (
    typed.promotionalStartsAt &&
    typed.promotionalEndsAt &&
    typed.promotionalEndsAt <= typed.promotionalStartsAt
  ) {
    errors.push('promotionalEndsAt debe ser posterior a promotionalStartsAt');
  }

  const isDefault = parseBoolean(value('isDefault'));
  if (isDefault.ok) typed.isDefault = isDefault.value;
  else errors.push(isDefault.message);

  const attributes = parseAttributes(value('attributes'));
  if (attributes.ok) typed.attributes = attributes.value;
  else errors.push(attributes.message);

  if (existing.variant) {
    const transitionError = validateTransition('variantStatus', existing.variant.status, typed.variantStatus);
    if (transitionError) errors.push(transitionError);
  }
  if (existing.product) {
    const productStatusTarget = typed.status;
    const transitionError = validateTransition('status', existing.product.status, productStatusTarget);
    if (transitionError) errors.push(transitionError);
  }

  // Deterministic action + NOOP detection.
  let action: ImportAction = 'CREATE';
  if (existing.variant) {
    const variantUnchanged =
      sameString(typed.variantName, existing.variant.name) &&
      sameString(typed.barcode, existing.variant.barcode) &&
      (typed.variantStatus === null || typed.variantStatus === existing.variant.status) &&
      (typed.isDefault === null || typed.isDefault === existing.variant.isDefault) &&
      (typed.attributes === null ||
        JSON.stringify(typed.attributes) === JSON.stringify(existing.variant.attributes ?? []));
    const productUnchanged =
      !existing.product ||
      ((typed.name === null || typed.name === existing.product.name) &&
        sameString(typed.shortDescription, existing.product.shortDescription) &&
        sameString(typed.description, existing.product.description) &&
        (typed.productType === null || typed.productType === existing.product.productType) &&
        (typed.visibility === null || typed.visibility === existing.product.visibility) &&
        (typed.condition === null || typed.condition === existing.product.condition) &&
        (typed.warrantyMonths === null || typed.warrantyMonths === existing.product.warrantyMonths) &&
        sameString(typed.seoTitle, existing.product.seoTitle) &&
        sameString(typed.seoDescription, existing.product.seoDescription));
    action = variantUnchanged && productUnchanged && !typed.hasPriceData && !typed.hasInventoryData ? 'NOOP' : 'UPDATE';
  }

  return {
    row: rowNumber,
    slug: typed.slug,
    name,
    sku: sku ?? '',
    action,
    data: raw,
    typed,
    errors,
  };
}

export function summarize(rows: NormalizedImportRow[]): {
  valid: NormalizedImportRow[];
  invalid: NormalizedImportRow[];
  toCreate: number;
  toUpdate: number;
  noop: number;
} {
  const valid = rows.filter((row) => row.errors.length === 0);
  const invalid = rows.filter((row) => row.errors.length > 0);
  return {
    valid,
    invalid,
    toCreate: valid.filter((row) => row.action === 'CREATE').length,
    toUpdate: valid.filter((row) => row.action === 'UPDATE').length,
    noop: valid.filter((row) => row.action === 'NOOP').length,
  };
}