import { describe, it, expect } from '@jest/globals';
import {
  normalizeRow,
  summarize,
  STATUS_TRANSITIONS,
  type ExistingVariant,
} from '../product-import.processor';

const product = {
  slug: 'laptop',
  name: 'Laptop',
  status: 'DRAFT',
  visibility: 'PUBLIC',
  productType: 'PHYSICAL',
  condition: 'NEW',
  warrantyMonths: null,
  shortDescription: null,
  description: null,
  seoTitle: null,
  seoDescription: null,
};

const existingVariant: ExistingVariant = {
  sku: 'LAP-001',
  name: 'Laptop 16"',
  barcode: null,
  status: 'ACTIVE',
  isDefault: true,
  attributes: [],
  product,
};

describe('product import processor', () => {
  it('detects a new product+variant as CREATE', () => {
    const row = normalizeRow(
      {
        sku: 'NEW-001',
        slug: 'nuevo-producto',
        name: 'Nuevo Producto',
        status: 'DRAFT',
        visibility: 'PUBLIC',
        productType: 'PHYSICAL',
        condition: 'NEW',
        listAmount: '1000',
        onHand: '5',
      },
      2,
      {},
    );
    expect(row.errors).toEqual([]);
    expect(row.action).toBe('CREATE');
    expect(row.typed['listAmount']).toBe(1000);
    expect(row.typed['onHand']).toBe(5);
    expect(row.typed['hasPriceData']).toBe(true);
    expect(row.typed['hasInventoryData']).toBe(true);
  });

  it('flags missing sku as an error', () => {
    const row = normalizeRow({ slug: 'sin-sku', name: 'Sin SKU' }, 2, {});
    expect(row.errors).toContain('sku es obligatorio');
  });

  it('flags an invalid status enum', () => {
    const row = normalizeRow(
      { sku: 'S-1', slug: 'p', name: 'P', status: 'SOLD' },
      2,
      {},
    );
    expect(row.errors.join(' ')).toMatch(/status inválido/);
  });

  it('flags an invalid status transition (ARCHIVED cannot publish)', () => {
    const archived: ExistingVariant = { ...existingVariant, status: 'ARCHIVED' };
    const row = normalizeRow({ sku: 'LAP-001', variantStatus: 'ACTIVE' }, 2, {
      variant: archived,
    });
    expect(row.errors.join(' ')).toMatch(/transición de estado inválida/);
  });

  it('keeps a valid transition from DRAFT to ACTIVE', () => {
    const row = normalizeRow({ sku: 'LAP-001', status: 'ACTIVE' }, 2, {
      variant: existingVariant,
      product,
    });
    expect(row.errors).toEqual([]);
  });

  it('detects an unchanged existing variant as NOOP', () => {
    const row = normalizeRow(
      { sku: 'LAP-001', variantName: 'Laptop 16"', status: 'ACTIVE', isDefault: 'true' },
      2,
      { variant: existingVariant, product },
    );
    expect(row.errors).toEqual([]);
    expect(row.action).toBe('NOOP');
  });

  it('detects changes on an existing variant as UPDATE', () => {
    const row = normalizeRow({ sku: 'LAP-001', variantName: 'Laptop 16" Pro', status: 'ACTIVE' }, 2, {
      variant: existingVariant,
      product,
    });
    expect(row.action).toBe('UPDATE');
  });

  it('rejects a promotional window with endsAt <= startsAt', () => {
    const row = normalizeRow(
      {
        sku: 'S-2',
        slug: 'p2',
        name: 'P2',
        promotionalStartsAt: '2026-08-20T10:00:00.000Z',
        promotionalEndsAt: '2026-08-19T10:00:00.000Z',
      },
      2,
      {},
    );
    expect(row.errors.join(' ')).toMatch(/promotionalEndsAt/);
  });

  it('rejects non-numeric amounts', () => {
    const row = normalizeRow(
      { sku: 'S-3', slug: 'p3', name: 'P3', listAmount: 'mil' },
      2,
      {},
    );
    expect(row.errors.join(' ')).toMatch(/listAmount/);
  });

  it('summarizes valid/invalid/create/update/noop counts', () => {
    const rows = [
      normalizeRow({ sku: 'A-1', slug: 'a', name: 'A' }, 2, {}),
      normalizeRow({ sku: 'LAP-001', variantName: 'Nuevo nombre' }, 3, {
        variant: existingVariant,
        product,
      }),
      normalizeRow({ sku: 'LAP-001', variantName: 'Laptop 16"' }, 4, {
        variant: existingVariant,
        product,
      }),
      normalizeRow({ sku: '' }, 5, {}),
    ];
    const { valid, invalid, toCreate, toUpdate, noop } = summarize(rows);
    expect(valid.length).toBe(3);
    expect(invalid.length).toBe(1);
    expect(toCreate).toBe(1);
    expect(toUpdate).toBe(1);
    expect(noop).toBe(1);
  });

  it('defines the product status transition matrix', () => {
    expect(STATUS_TRANSITIONS.DRAFT).toEqual(['ACTIVE', 'ARCHIVED']);
    expect(STATUS_TRANSITIONS.ARCHIVED).toEqual(['DRAFT']);
  });
});
