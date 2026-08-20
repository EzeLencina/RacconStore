import { describe, it, expect } from 'vitest';
import {
  RELATION_TYPES,
  toRelationCard,
} from '../../src/lib/products/relations.types';

describe('product relations helpers', () => {
  it('defines the three relation types', () => {
    expect(Object.keys(RELATION_TYPES).sort()).toEqual(['ALTERNATIVE', 'COMPLEMENTARY', 'RELATED']);
  });

  it('maps a DB product to a relation card with default display values', () => {
    const card = toRelationCard({ id: 'p1', name: 'Cerradura', slug: 'cerradura', status: 'ACTIVE' });
    expect(card.id).toBe('p1');
    expect(card.name).toBe('Cerradura');
    expect(card.slug).toBe('cerradura');
    expect(card.inStock).toBe(true);
    expect(card.price).toBe(0);
    expect(card.images).toEqual([]);
  });

  it('maps a non-active product as out of stock', () => {
    const card = toRelationCard({ id: 'p2', name: 'Cámara', slug: 'camara', status: 'DRAFT' });
    expect(card.inStock).toBe(false);
  });
});