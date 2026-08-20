import { describe, it, expect } from 'vitest';
import {
  normalizeRow,
  sanitizeCsvCell,
  STATUS_TRANSITIONS,
  type ExistingProduct,
  type ExistingVariant,
  type ParsedRow,
} from '../../src/lib/products/import-export.types';

function product(overrides: Partial<ExistingProduct> = {}): ExistingProduct {
  return {
    slug: 'campera',
    name: 'Campera',
    status: 'DRAFT',
    visibility: 'PUBLIC',
    productType: 'PHYSICAL',
    condition: 'NEW',
    warrantyMonths: null,
    shortDescription: null,
    description: null,
    seoTitle: null,
    seoDescription: null,
    ...overrides,
  };
}

function variant(overrides: Partial<ExistingVariant> = {}): ExistingVariant {
  return {
    sku: 'CMP-001',
    name: 'Negra',
    barcode: null,
    status: 'ACTIVE',
    isDefault: true,
    attributes: [],
    product: product(),
    ...overrides,
  };
}

function row(overrides: Partial<ParsedRow> = {}): ParsedRow {
  return { sku: 'CMP-001', slug: 'campera', name: 'Campera', ...overrides };
}

describe('sanitizeCsvCell', () => {
  it('neutralizes formula injection prefixes', () => {
    expect(sanitizeCsvCell('=1+1')).toBe("'=1+1");
    expect(sanitizeCsvCell('+SUM(A1)')).toBe("'+SUM(A1)");
    expect(sanitizeCsvCell('-cmd')).toBe("'-cmd");
    expect(sanitizeCsvCell('@mail')).toBe("'@mail");
  });

  it('leaves safe values untouched', () => {
    expect(sanitizeCsvCell('Campera')).toBe('Campera');
    expect(sanitizeCsvCell(null)).toBe('');
    expect(sanitizeCsvCell(123)).toBe('123');
  });
});

describe('normalizeRow', () => {
  it('flags missing sku as required', () => {
    const result = normalizeRow(row({ sku: null }), 2, {});
    expect(result.errors).toContain('sku es obligatorio');
  });

  it('creates a new variant when the sku does not exist', () => {
    const result = normalizeRow(row(), 2, {});
    expect(result.action).toBe('CREATE');
    expect(result.errors).toEqual([]);
  });

  it('flags a NOOP when nothing changes', () => {
    const result = normalizeRow(row(), 2, { variant: variant() });
    expect(result.action).toBe('NOOP');
    expect(result.errors).toEqual([]);
  });

  it('flags an UPDATE when price data changes', () => {
    const result = normalizeRow(row({ listAmount: '15000' }), 2, { variant: variant() });
    expect(result.action).toBe('UPDATE');
  });

  it('flags an UPDATE when product fields change', () => {
    const result = normalizeRow(row({ name: 'Campera nueva' }), 2, { variant: variant() });
    expect(result.action).toBe('UPDATE');
  });

  it('rejects an invalid status transition', () => {
    const result = normalizeRow(row({ status: 'DRAFT' }), 2, {
      variant: variant({ product: product({ status: 'ACTIVE' }) }),
    });
    expect(result.errors.some((e) => e.includes('transición de estado inválida'))).toBe(true);
  });

  it('rejects invalid enums', () => {
    const result = normalizeRow(row({ productType: 'CARRO' }), 2, {});
    expect(result.errors.some((e) => e.includes('productType inválido'))).toBe(true);
  });

  it('rejects an invalid promotional window', () => {
    const result = normalizeRow(
      row({
        promotionalStartsAt: '2026-08-20T00:00:00.000Z',
        promotionalEndsAt: '2026-08-19T00:00:00.000Z',
      }),
      2,
      {},
    );
    expect(result.errors.some((e) => e.includes('posterior a promotionalStartsAt'))).toBe(true);
  });

  it('parses attributes as JSON', () => {
    const result = normalizeRow(row({ attributes: '{"color":"negro"}' }), 2, {});
    expect(result.typed.attributes).toEqual({ color: 'negro' });
  });

  it('rejects invalid attributes JSON', () => {
    const result = normalizeRow(row({ attributes: '{no-json' }), 2, {});
    expect(result.errors.some((e) => e.includes('JSON válido'))).toBe(true);
  });

  it('detects duplicate sku handling by first match', () => {
    expect(STATUS_TRANSITIONS['DRAFT']).toContain('ACTIVE');
    expect(STATUS_TRANSITIONS['ACTIVE']).toContain('INACTIVE');
    expect(STATUS_TRANSITIONS['ARCHIVED']).toContain('DRAFT');
  });
});