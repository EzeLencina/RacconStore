export const IMPORT_EXPORT_LIMITS = {
  MAX_ROWS: 2000,
  BATCH_SIZE: 100,
} as const;

export const EXPORT_COLUMNS = [
  'slug',
  'name',
  'shortDescription',
  'description',
  'productType',
  'status',
  'visibility',
  'condition',
  'warrantyMonths',
  'seoTitle',
  'seoDescription',
  'sku',
  'variantName',
  'barcode',
  'variantStatus',
  'isDefault',
  'attributes',
  'costAmount',
  'listAmount',
  'saleAmount',
  'promotionalAmount',
  'promotionalStartsAt',
  'promotionalEndsAt',
  'onHand',
  'minimumStock',
] as const;

const PRODUCT_TYPES = ['PHYSICAL', 'DIGITAL', 'SERVICE', 'BUNDLE'] as const;
const PRODUCT_STATUSES = ['DRAFT', 'ACTIVE', 'INACTIVE', 'ARCHIVED'] as const;
const PRODUCT_VISIBILITIES = ['PUBLIC', 'PRIVATE', 'HIDDEN'] as const;
const PRODUCT_CONDITIONS = ['NEW', 'REFURBISHED', 'USED'] as const;
const VARIANT_STATUSES = ['ACTIVE', 'INACTIVE', 'ARCHIVED'] as const;

export const STATUS_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ['ACTIVE', 'ARCHIVED'],
  ACTIVE: ['INACTIVE', 'ARCHIVED'],
  INACTIVE: ['ACTIVE', 'ARCHIVED'],
  ARCHIVED: ['DRAFT'],
};

/** CSV/formula injection protection: neutralizes dangerous leading characters. */
export function sanitizeCsvCell(value: unknown): string {
  const raw = value === null || value === undefined ? '' : String(value);
  const trimmed = raw.trim();
  if (['=', '+', '-', '@', '\t', '\r'].some((prefix) => trimmed.startsWith(prefix))) {
    return `'${raw}`;
  }
  return raw;
}

export type ParsedRow = Record<string, string | null>;

export type ImportAction = 'CREATE' | 'UPDATE' | 'NOOP';

export type ImportRowError = { row: number; sku: string; slug: string; errors: string[] };

export type ImportPreviewResult = {
  importId: string;
  mode: ImportMode;
  total: number;
  valid: number;
  invalid: number;
  toCreate: number;
  toUpdate: number;
  noop: number;
  errors: ImportRowError[];
};

export type ImportConfirmResult = {
  importId: string;
  applied: boolean;
  created: number;
  updated: number;
  noop: number;
  errors: ImportRowError[];
};

export type ImportMode = 'CREATE' | 'UPDATE' | 'UPSERT';

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

export type NormalizedRow = {
  row: number;
  slug: string;
  name: string | null;
  sku: string;
  action: ImportAction;
  typed: TypedImportRow;
  errors: string[];
};

function parseInteger(value: string | null): { ok: true; value: number | null } | { ok: false; message: string } {
  if (value === null || value === '') return { ok: true, value: null };
  if (!/^-?\d+$/.test(value)) return { ok: false, message: 'debe ser un entero' };
  const parsed = parseInt(value, 10);
  if (parsed < 0) return { ok: false, message: 'no puede ser negativo' };
  return { ok: true, value: parsed };
}

function parseDate(value: string | null): { ok: true; value: Date | null } | { ok: false; message: string } {
  if (value === null || value === '') return { ok: true, value: null };
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return { ok: false, message: 'fecha inválida (usá formato ISO UTC)' };
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
  if (['true', 'TRUE', '1'].includes(value)) return { ok: true, value: true };
  if (['false', 'FALSE', '0'].includes(value)) return { ok: true, value: false };
  return { ok: false, message: 'isDefault debe ser true o false' };
}

function parseEnum(
  value: string | null,
  allowed: readonly string[],
  label: string,
): { ok: true; value: string | null } | { ok: false; message: string } {
  if (value === null || value === '') return { ok: true, value: null };
  if (!allowed.includes(value)) return { ok: false, message: `${label} inválido (${allowed.join('/')})` };
  return { ok: true, value };
}

function validateTransition(field: string, current: string, target: string | null): string | null {
  if (target === null || target === current) return null;
  const allowed = STATUS_TRANSITIONS[current];
  if (!allowed || !allowed.includes(target)) {
    return `transición de estado inválida para ${field}: ${current} → ${target}`;
  }
  return null;
}

/** Pure row validation/normalization against existing records. slug=product, sku=variant. */
export function normalizeRow(
  row: ParsedRow,
  rowNumber: number,
  existing: { product?: ExistingProduct; variant?: ExistingVariant },
): NormalizedRow {
  const errors: string[] = [];
  const value = (column: string): string | null => {
    const v = row[column];
    if (v === undefined || v === null || v === '') return null;
    const trimmed = String(v).trim();
    return trimmed === '' ? null : trimmed;
  };

  const sku = value('sku');
  const slug = value('slug');
  const name = value('name');

  const productRecord = existing.variant?.product ?? existing.product;

  if (!sku) errors.push('sku es obligatorio');
  if (!existing.variant && !slug) errors.push('slug es obligatorio al crear una variante nueva');
  if (!existing.variant && !productRecord && !name) errors.push('name es obligatorio al crear un producto nuevo');

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

  const enumChecks: Array<[keyof TypedImportRow, string | null, readonly string[], string]> = [
    ['productType', value('productType'), PRODUCT_TYPES, 'productType'],
    ['status', value('status'), PRODUCT_STATUSES, 'status'],
    ['visibility', value('visibility'), PRODUCT_VISIBILITIES, 'visibility'],
    ['condition', value('condition'), PRODUCT_CONDITIONS, 'condition'],
    ['variantStatus', value('variantStatus'), VARIANT_STATUSES, 'variantStatus'],
  ];
  for (const [key, raw, allowed, label] of enumChecks) {
    const result = parseEnum(raw, allowed, label);
    if (result.ok) typed[key] = result.value as never;
    else errors.push(result.message);
  }

  const warranty = parseInteger(value('warrantyMonths'));
  if (warranty.ok) typed.warrantyMonths = warranty.value;
  else errors.push(`warrantyMonths ${warranty.message}`);

  for (const column of ['costAmount', 'listAmount', 'saleAmount', 'promotionalAmount', 'onHand', 'minimumStock'] as const) {
    const parsed = parseInteger(value(column));
    if (parsed.ok) typed[column] = parsed.value;
    else errors.push(`${column} ${parsed.message}`);
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
  if (typed.promotionalStartsAt && typed.promotionalEndsAt && typed.promotionalEndsAt <= typed.promotionalStartsAt) {
    errors.push('promotionalEndsAt debe ser posterior a promotionalStartsAt');
  }

  const isDefault = parseBoolean(value('isDefault'));
  if (isDefault.ok) typed.isDefault = isDefault.value;
  else errors.push(isDefault.message);

  const attributes = parseAttributes(value('attributes'));
  if (attributes.ok) typed.attributes = attributes.value;
  else errors.push(attributes.message);

  if (existing.variant) {
    const variantError = validateTransition('variantStatus', existing.variant.status, typed.variantStatus);
    if (variantError) errors.push(variantError);
  }
  if (productRecord) {
    const productError = validateTransition('status', productRecord.status, typed.status);
    if (productError) errors.push(productError);
  }

  let action: ImportAction = 'CREATE';
  if (existing.variant) {
    const variantUnchanged =
      (typed.variantName === null || typed.variantName === existing.variant.name) &&
      (typed.barcode === null || typed.barcode === existing.variant.barcode) &&
      (typed.variantStatus === null || typed.variantStatus === existing.variant.status) &&
      (typed.isDefault === null || typed.isDefault === existing.variant.isDefault) &&
      (typed.attributes === null ||
        JSON.stringify(typed.attributes) === JSON.stringify(existing.variant.attributes ?? []));
    const productUnchanged =
      !productRecord ||
      ((typed.name === null || typed.name === productRecord.name) &&
        (typed.shortDescription === null || typed.shortDescription === productRecord.shortDescription) &&
        (typed.description === null || typed.description === productRecord.description) &&
        (typed.productType === null || typed.productType === productRecord.productType) &&
        (typed.visibility === null || typed.visibility === productRecord.visibility) &&
        (typed.condition === null || typed.condition === productRecord.condition) &&
        (typed.warrantyMonths === null || typed.warrantyMonths === productRecord.warrantyMonths) &&
        (typed.seoTitle === null || typed.seoTitle === productRecord.seoTitle) &&
        (typed.seoDescription === null || typed.seoDescription === productRecord.seoDescription));
    action = variantUnchanged && productUnchanged && !typed.hasPriceData && !typed.hasInventoryData ? 'NOOP' : 'UPDATE';
  }

  return { row: rowNumber, slug: typed.slug, name, sku: sku ?? '', action, typed, errors };
}