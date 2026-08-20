import { createSlug } from '@tienda/ui';

export const PRODUCT_TYPES = ['PHYSICAL', 'DIGITAL', 'SERVICE', 'BUNDLE'] as const;
export const PRODUCT_STATUSES = ['DRAFT', 'ACTIVE', 'INACTIVE', 'ARCHIVED'] as const;
export const PRODUCT_VISIBILITIES = ['PUBLIC', 'PRIVATE', 'HIDDEN'] as const;
export const PRODUCT_CONDITIONS = ['NEW', 'REFURBISHED', 'USED'] as const;
export const VARIANT_STATUSES = ['ACTIVE', 'INACTIVE', 'ARCHIVED'] as const;

export type ProductTypeValue = (typeof PRODUCT_TYPES)[number];
export type ProductStatusValue = (typeof PRODUCT_STATUSES)[number];
export type ProductVisibilityValue = (typeof PRODUCT_VISIBILITIES)[number];
export type ProductConditionValue = (typeof PRODUCT_CONDITIONS)[number];
export type VariantStatusValue = (typeof VARIANT_STATUSES)[number];

export type ProductInput = {
  name: string;
  slug?: string;
  shortDescription?: string | null;
  description?: string | null;
  productType: ProductTypeValue;
  status: ProductStatusValue;
  visibility: ProductVisibilityValue;
  condition: ProductConditionValue;
  warrantyMonths?: number | null;
  brandId?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
};

export type VariantInput = {
  sku: string;
  name?: string | null;
  barcode?: string | null;
  status: VariantStatusValue;
  isDefault?: boolean;
  attributes?: Record<string, string | number | boolean>[];
};

export type VariantAttribute = { key: string; value: string | number | boolean };

export class ProductCrudError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
  }
}

export function assertEnum<T extends string>(value: string, allowed: readonly T[], label: string): T {
  if (!allowed.includes(value as T)) {
    throw new ProductCrudError(`${label} inválido (${allowed.join('/')})`, 400);
  }
  return value as T;
}

export function normalizeName(value: string): string {
  const name = value.trim();
  if (!name) throw new ProductCrudError('El nombre es obligatorio', 400);
  return name;
}

export function normalizeSlug(inputSlug: string | undefined, name: string): string {
  const slug = (inputSlug?.trim() ? createSlug(inputSlug) : createSlug(name)).replace(/^-+|-+$/g, '');
  if (!slug) throw new ProductCrudError('El slug no puede estar vacío', 400);
  return slug;
}

export function toNullableInt(value: unknown): number | null {
  if (value === undefined || value === null || value === '') return null;
  const n = Number(value);
  if (!Number.isInteger(n) || n < 0) throw new ProductCrudError('warrantyMonths debe ser un entero >= 0', 400);
  return n;
}

export function toNullableString(value: unknown): string | null {
  if (value === undefined || value === null) return null;
  const s = String(value).trim();
  return s === '' ? null : s;
}

export function normalizeVariantAttributes(value: unknown): VariantAttribute[] {
  if (value === undefined || value === null || value === '') return [];
  if (!Array.isArray(value)) throw new ProductCrudError('attributes debe ser un arreglo JSON', 400);
  return value.map((item) => {
    if (typeof item !== 'object' || item === null || Array.isArray(item)) {
      throw new ProductCrudError('Cada atributo debe ser un objeto { key, value }', 400);
    }
    const record = item as Record<string, unknown>;
    const key = String(record['key'] ?? '').trim();
    const val = record['value'];
    if (!key) throw new ProductCrudError('Cada atributo necesita una key', 400);
    return { key, value: val as string | number | boolean };
  });
}

export function validateProductInput(input: ProductInput): void {
  normalizeName(input.name);
  normalizeSlug(input.slug, input.name);
  assertEnum(input.productType, PRODUCT_TYPES, 'productType');
  assertEnum(input.status, PRODUCT_STATUSES, 'status');
  assertEnum(input.visibility, PRODUCT_VISIBILITIES, 'visibility');
  assertEnum(input.condition, PRODUCT_CONDITIONS, 'condition');
  if (input.warrantyMonths !== undefined && input.warrantyMonths !== null) {
    toNullableInt(input.warrantyMonths);
  }
}

export function validateVariantInput(input: VariantInput): void {
  if (!input.sku.trim()) throw new ProductCrudError('El SKU es obligatorio', 400);
  assertEnum(input.status, VARIANT_STATUSES, 'status');
  normalizeVariantAttributes(input.attributes);
}