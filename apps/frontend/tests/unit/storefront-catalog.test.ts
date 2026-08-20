import { describe, it, expect } from 'vitest';
import { computeDisplayPrice } from '../../src/lib/storefront/pricing';

function price(overrides: Partial<{
  listAmount: number;
  saleAmount: number | null;
  promotionalAmount: number | null;
  promotionalStartsAt: Date | null;
  promotionalEndsAt: Date | null;
}> = {}) {
  return {
    listAmount: 100000,
    saleAmount: null,
    promotionalAmount: null,
    promotionalStartsAt: null,
    promotionalEndsAt: null,
    ...overrides,
  };
}

describe('computeDisplayPrice', () => {
  it('returns zero when there is no price', () => {
    expect(computeDisplayPrice(null)).toEqual({ price: 0 });
    expect(computeDisplayPrice(undefined)).toEqual({ price: 0 });
  });

  it('uses the list price when there is no sale or promo', () => {
    expect(computeDisplayPrice(price())).toEqual({ price: 100000 });
  });

  it('uses the sale price and shows the list price as reference', () => {
    const result = computeDisplayPrice(price({ saleAmount: 80000 }));
    expect(result.price).toBe(80000);
    expect(result.originalPrice).toBe(100000);
    expect(result.discount).toBe(20);
  });

  it('does not show a discount when sale price equals list price', () => {
    expect(computeDisplayPrice(price({ saleAmount: 100000 }))).toEqual({ price: 100000 });
  });

  it('uses the promotional price while the promo window is active', () => {
    const now = new Date('2026-08-01T12:00:00Z');
    const result = computeDisplayPrice(
      price({
        saleAmount: 90000,
        promotionalAmount: 75000,
        promotionalStartsAt: new Date('2026-07-01T00:00:00Z'),
        promotionalEndsAt: new Date('2026-09-01T00:00:00Z'),
      }),
      now,
    );
    expect(result.price).toBe(75000);
    expect(result.originalPrice).toBe(90000);
    expect(result.discount).toBe(17);
  });

  it('ignores a promo that has not started yet', () => {
    const now = new Date('2026-06-01T12:00:00Z');
    const result = computeDisplayPrice(
      price({
        saleAmount: 90000,
        promotionalAmount: 75000,
        promotionalStartsAt: new Date('2026-07-01T00:00:00Z'),
        promotionalEndsAt: new Date('2026-09-01T00:00:00Z'),
      }),
      now,
    );
    expect(result.price).toBe(90000);
    expect(result.originalPrice).toBe(100000);
  });

  it('ignores an expired promo', () => {
    const now = new Date('2026-10-01T12:00:00Z');
    const result = computeDisplayPrice(
      price({
        saleAmount: 90000,
        promotionalAmount: 75000,
        promotionalStartsAt: new Date('2026-07-01T00:00:00Z'),
        promotionalEndsAt: new Date('2026-09-01T00:00:00Z'),
      }),
      now,
    );
    expect(result.price).toBe(90000);
  });

  it('does not show an original price when the promo equals the base price', () => {
    const now = new Date('2026-08-01T12:00:00Z');
    const result = computeDisplayPrice(
      price({
        saleAmount: 75000,
        promotionalAmount: 75000,
        promotionalStartsAt: new Date('2026-07-01T00:00:00Z'),
        promotionalEndsAt: new Date('2026-09-01T00:00:00Z'),
      }),
      now,
    );
    expect(result.price).toBe(75000);
    expect(result.originalPrice).toBeUndefined();
    expect(result.discount).toBeUndefined();
  });

  it('uses the list price as reference when promo applies over the list price', () => {
    const now = new Date('2026-08-01T12:00:00Z');
    const result = computeDisplayPrice(
      price({
        promotionalAmount: 70000,
        promotionalStartsAt: new Date('2026-07-01T00:00:00Z'),
        promotionalEndsAt: new Date('2026-09-01T00:00:00Z'),
      }),
      now,
    );
    expect(result.price).toBe(70000);
    expect(result.originalPrice).toBe(100000);
    expect(result.discount).toBe(30);
  });
});