import { describe, it, expect } from 'vitest';
import {
  validateSchedule,
  getEffectiveStatus,
  isProductPublicable,
} from '../../src/lib/products/lifecycle.types';

const now = new Date('2026-08-19T12:00:00.000Z');

describe('schedule validation', () => {
  it('accepts a window with unpublishAt after publishAt', () => {
    const result = validateSchedule(
      new Date('2026-08-20T10:00:00.000Z'),
      new Date('2026-08-21T10:00:00.000Z'),
    );
    expect(result.valid).toBe(true);
  });

  it('rejects unpublishAt equal to publishAt', () => {
    const result = validateSchedule(
      new Date('2026-08-20T10:00:00.000Z'),
      new Date('2026-08-20T10:00:00.000Z'),
    );
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/posterior/i);
  });

  it('rejects unpublishAt before publishAt', () => {
    const result = validateSchedule(
      new Date('2026-08-21T10:00:00.000Z'),
      new Date('2026-08-20T10:00:00.000Z'),
    );
    expect(result.valid).toBe(false);
  });

  it('accepts clearing the window (both null)', () => {
    expect(validateSchedule(null, null).valid).toBe(true);
  });
});

describe('effective status (deterministic at read time, UTC)', () => {
  it('keeps DRAFT until publishAt arrives', () => {
    const product = { status: 'DRAFT', publishAt: '2026-08-20T10:00:00.000Z', unpublishAt: null };
    expect(getEffectiveStatus(product, now)).toBe('DRAFT');
  });

  it('publishes a DRAFT product once publishAt passes', () => {
    const product = { status: 'DRAFT', publishAt: '2026-08-19T10:00:00.000Z', unpublishAt: null };
    expect(getEffectiveStatus(product, now)).toBe('ACTIVE');
  });

  it('makes a product inactive once unpublishAt passes', () => {
    const product = {
      status: 'DRAFT',
      publishAt: '2026-08-18T10:00:00.000Z',
      unpublishAt: '2026-08-19T11:00:00.000Z',
    };
    expect(getEffectiveStatus(product, now)).toBe('INACTIVE');
  });

  it('keeps ACTIVE public while inside its window', () => {
    const product = {
      status: 'ACTIVE',
      publishAt: '2026-08-19T11:00:00.000Z',
      unpublishAt: '2026-08-20T11:00:00.000Z',
    };
    expect(getEffectiveStatus(product, now)).toBe('ACTIVE');
  });

  it('pulls back an ACTIVE product whose publishAt is still in the future', () => {
    const product = { status: 'ACTIVE', publishAt: '2026-08-20T10:00:00.000Z', unpublishAt: null };
    expect(getEffectiveStatus(product, now)).toBe('DRAFT');
  });

  it('deactivates an ACTIVE product whose unpublishAt passed', () => {
    const product = { status: 'ACTIVE', publishAt: null, unpublishAt: '2026-08-19T11:00:00.000Z' };
    expect(getEffectiveStatus(product, now)).toBe('INACTIVE');
  });

  it('never unarchives via schedule', () => {
    const product = {
      status: 'ARCHIVED',
      publishAt: '2026-08-18T10:00:00.000Z',
      unpublishAt: null,
    };
    expect(getEffectiveStatus(product, now)).toBe('ARCHIVED');
  });
});

describe('isProductPublicable', () => {
  it('is true for an ACTIVE public product', () => {
    expect(
      isProductPublicable(
        { status: 'ACTIVE', visibility: 'PUBLIC', deletedAt: null, publishAt: null, unpublishAt: null },
        now,
      ),
    ).toBe(true);
  });

  it('is false outside the effective window', () => {
    expect(
      isProductPublicable(
        {
          status: 'DRAFT',
          visibility: 'PUBLIC',
          deletedAt: null,
          publishAt: '2026-08-20T10:00:00.000Z',
          unpublishAt: null,
        },
        now,
      ),
    ).toBe(false);
  });

  it('is false for non-public visibility', () => {
    expect(
      isProductPublicable(
        { status: 'ACTIVE', visibility: 'PRIVATE', deletedAt: null, publishAt: null, unpublishAt: null },
        now,
      ),
    ).toBe(false);
  });

  it('is false for deleted products', () => {
    expect(
      isProductPublicable(
        {
          status: 'ACTIVE',
          visibility: 'PUBLIC',
          deletedAt: new Date(),
          publishAt: null,
          unpublishAt: null,
        },
        now,
      ),
    ).toBe(false);
  });
});