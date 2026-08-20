import { describe, it, expect } from 'vitest';
import {
  PRODUCT_STATUSES,
  STATUS_TRANSITIONS,
  STATUS_LABELS,
  AUDIT_ACTION_FOR_TARGET,
  getAllowedTransitions,
  canTransitionTo,
  getPublishReadiness,
} from '../../src/lib/products/lifecycle.types';

describe('product lifecycle transitions', () => {
  it('defines the four statuses', () => {
    expect(PRODUCT_STATUSES).toEqual(['DRAFT', 'ACTIVE', 'INACTIVE', 'ARCHIVED']);
  });

  it('matches the domain transition matrix', () => {
    expect(STATUS_TRANSITIONS).toEqual({
      DRAFT: ['ACTIVE', 'ARCHIVED'],
      ACTIVE: ['INACTIVE', 'ARCHIVED'],
      INACTIVE: ['ACTIVE', 'ARCHIVED'],
      ARCHIVED: ['DRAFT'],
    });
  });

  it('labels every status', () => {
    expect(Object.keys(STATUS_LABELS).sort()).toEqual([...PRODUCT_STATUSES].sort());
  });

  it('maps every target to an audit action', () => {
    expect(AUDIT_ACTION_FOR_TARGET).toEqual({
      DRAFT: 'PRODUCT_RESTORE',
      ACTIVE: 'PRODUCT_PUBLISH',
      INACTIVE: 'PRODUCT_DEACTIVATE',
      ARCHIVED: 'PRODUCT_ARCHIVE',
    });
  });

  it('allows DRAFT to publish or archive', () => {
    expect(getAllowedTransitions('DRAFT')).toEqual(['ACTIVE', 'ARCHIVED']);
    expect(canTransitionTo('DRAFT', 'ACTIVE')).toBe(true);
    expect(canTransitionTo('DRAFT', 'INACTIVE')).toBe(false);
  });

  it('allows ARCHIVED only to restore to DRAFT', () => {
    expect(getAllowedTransitions('ARCHIVED')).toEqual(['DRAFT']);
    expect(canTransitionTo('ARCHIVED', 'DRAFT')).toBe(true);
    expect(canTransitionTo('ARCHIVED', 'ACTIVE')).toBe(false);
  });
});

describe('product publish readiness (domain rule ProductCanBePublished)', () => {
  it('allows a DRAFT product with name and slug', () => {
    const readiness = getPublishReadiness({ status: 'DRAFT', name: 'Laptop', slug: 'laptop' });
    expect(readiness.canPublish).toBe(true);
    expect(readiness.blockers).toEqual([]);
  });

  it('allows an INACTIVE product with name and slug', () => {
    const readiness = getPublishReadiness({ status: 'INACTIVE', name: 'Monitor', slug: 'monitor' });
    expect(readiness.canPublish).toBe(true);
  });

  it('blocks ACTIVE (already published) from publishing again', () => {
    const readiness = getPublishReadiness({ status: 'ACTIVE', name: 'Teclado', slug: 'teclado' });
    expect(readiness.canPublish).toBe(false);
    expect(readiness.blockers[0]?.code).toBe('INVALID_STATUS');
  });

  it('blocks a product without name', () => {
    const readiness = getPublishReadiness({ status: 'DRAFT', name: '  ', slug: 'sin-nombre' });
    expect(readiness.canPublish).toBe(false);
    expect(readiness.blockers.map((b) => b.code)).toContain('MISSING_NAME');
  });

  it('blocks a product without slug', () => {
    const readiness = getPublishReadiness({ status: 'INACTIVE', name: 'Cámara', slug: '' });
    expect(readiness.canPublish).toBe(false);
    expect(readiness.blockers.map((b) => b.code)).toContain('MISSING_SLUG');
  });
});