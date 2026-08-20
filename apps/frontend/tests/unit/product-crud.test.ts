import { describe, it, expect } from 'vitest';
import {
  PRODUCT_TYPES,
  PRODUCT_STATUSES,
  PRODUCT_VISIBILITIES,
  PRODUCT_CONDITIONS,
  VARIANT_STATUSES,
  normalizeSlug,
  normalizeName,
  normalizeVariantAttributes,
  toNullableInt,
  toNullableString,
  assertEnum,
  validateProductInput,
  validateVariantInput,
  ProductCrudError,
  type ProductInput,
  type VariantInput,
} from '../../src/lib/products/crud.types';

function validProduct(): ProductInput {
  return {
    name: '  Auriculares Pro  ',
    productType: 'PHYSICAL',
    status: 'DRAFT',
    visibility: 'PUBLIC',
    condition: 'NEW',
  };
}

describe('product crud validation', () => {
  it('exposes the domain enums', () => {
    expect(PRODUCT_TYPES).toEqual(['PHYSICAL', 'DIGITAL', 'SERVICE', 'BUNDLE']);
    expect(PRODUCT_STATUSES).toEqual(['DRAFT', 'ACTIVE', 'INACTIVE', 'ARCHIVED']);
    expect(PRODUCT_VISIBILITIES).toEqual(['PUBLIC', 'PRIVATE', 'HIDDEN']);
    expect(PRODUCT_CONDITIONS).toEqual(['NEW', 'REFURBISHED', 'USED']);
    expect(VARIANT_STATUSES).toEqual(['ACTIVE', 'INACTIVE', 'ARCHIVED']);
  });

  it('normalizes the product name', () => {
    expect(normalizeName('  Auriculares Pro  ')).toBe('Auriculares Pro');
    expect(() => normalizeName('   ')).toThrow(ProductCrudError);
  });

  it('autogenerates a slug from the name when not provided', () => {
    expect(normalizeSlug(undefined, 'Auriculares Pro')).toBe('auriculares-pro');
  });

  it('normalizes a provided slug', () => {
    expect(normalizeSlug('  Auriculares-Pro  ', 'Auriculares Pro')).toBe('auriculares-pro');
  });

  it('rejects an empty slug', () => {
    expect(() => normalizeSlug(undefined, '!!!')).toThrow(ProductCrudError);
  });

  it('validates a full product input', () => {
    expect(() => validateProductInput(validProduct())).not.toThrow();
  });

  it('rejects unknown enum values', () => {
    expect(() =>
      validateProductInput({ ...validProduct(), status: 'PUBLISHED' as ProductInput['status'] }),
    ).toThrow(ProductCrudError);
    expect(() =>
      validateProductInput({ ...validProduct(), productType: 'DOWNLOAD' as ProductInput['productType'] }),
    ).toThrow(ProductCrudError);
  });

  it('rejects a missing name', () => {
    expect(() => validateProductInput({ ...validProduct(), name: '  ' })).toThrow(ProductCrudError);
  });

  it('normalizes nullable int fields', () => {
    expect(toNullableInt(undefined)).toBeNull();
    expect(toNullableInt('')).toBeNull();
    expect(toNullableInt(12)).toBe(12);
    expect(() => toNullableInt(-1)).toThrow(ProductCrudError);
    expect(() => toNullableInt('abc')).toThrow(ProductCrudError);
  });

  it('normalizes nullable string fields', () => {
    expect(toNullableString(undefined)).toBeNull();
    expect(toNullableString('   ')).toBeNull();
    expect(toNullableString('  hola  ')).toBe('hola');
  });

  it('normalizes variant attributes', () => {
    expect(normalizeVariantAttributes(undefined)).toEqual([]);
    expect(normalizeVariantAttributes([])).toEqual([]);
    expect(
      normalizeVariantAttributes([
        { key: ' color ', value: 'negro' },
        { key: 'talla', value: 'M' },
      ]),
    ).toEqual([
      { key: 'color', value: 'negro' },
      { key: 'talla', value: 'M' },
    ]);
  });

  it('rejects malformed variant attributes', () => {
    expect(() => normalizeVariantAttributes('nope')).toThrow(ProductCrudError);
    expect(() => normalizeVariantAttributes([{ value: 'sin key' }])).toThrow(ProductCrudError);
    expect(() => normalizeVariantAttributes([null])).toThrow(ProductCrudError);
  });

  it('validates variant inputs', () => {
    expect(() =>
      validateVariantInput({ sku: 'AUR-1', status: 'ACTIVE', attributes: [{ key: 'color', value: 'negro' }] }),
    ).not.toThrow();
    expect(() => validateVariantInput({ sku: '  ', status: 'ACTIVE' })).toThrow(ProductCrudError);
    expect(() =>
      validateVariantInput({ sku: 'AUR-1', status: 'DELETED' as VariantInput['status'] }),
    ).toThrow(ProductCrudError);
  });

  it('reports errors with an HTTP status', () => {
    try {
      validateProductInput({ ...validProduct(), status: 'BOGUS' as ProductInput['status'] });
      expect.unreachable();
    } catch (error) {
      expect(error).toBeInstanceOf(ProductCrudError);
      expect((error as ProductCrudError).status).toBe(400);
    }
  });

  it('asserts enum membership', () => {
    expect(assertEnum('ACTIVE', PRODUCT_STATUSES, 'status')).toBe('ACTIVE');
    expect(() => assertEnum('NOPE', PRODUCT_STATUSES, 'status')).toThrow(ProductCrudError);
  });
});