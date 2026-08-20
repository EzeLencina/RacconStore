import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword } from '../../src/lib/auth/password';
import { ROLES, PERMISSIONS, can, isAdmin, ROLE_PERMISSIONS } from '../../src/lib/auth/rbac';

describe('password hashing', () => {
  it('hashes and verifies a valid password', () => {
    const stored = hashPassword('S3cure-Pass!');
    expect(stored.startsWith('scrypt$')).toBe(true);
    expect(verifyPassword('S3cure-Pass!', stored)).toBe(true);
  });

  it('rejects an invalid password', () => {
    const stored = hashPassword('S3cure-Pass!');
    expect(verifyPassword('wrong-password', stored)).toBe(false);
  });

  it('produces unique salts per hash', () => {
    const a = hashPassword('same-password');
    const b = hashPassword('same-password');
    expect(a).not.toBe(b);
  });

  it('rejects malformed stored hashes', () => {
    expect(verifyPassword('password', 'not-a-hash')).toBe(false);
    expect(verifyPassword('password', 'scrypt$onlytwo')).toBe(false);
  });
});

describe('RBAC helpers', () => {
  it('detects the ADMIN role', () => {
    expect(isAdmin([ROLES.ADMIN])).toBe(true);
    expect(isAdmin([ROLES.CUSTOMER])).toBe(false);
  });

  it('grants every permission to ADMIN regardless of stored permissions', () => {
    expect(can([ROLES.ADMIN], [], PERMISSIONS.SETTINGS_MANAGE)).toBe(true);
    expect(can([ROLES.ADMIN], [], [PERMISSIONS.PRODUCTS_MANAGE, PERMISSIONS.INVENTORY_MANAGE])).toBe(true);
  });

  it('requires the stored permission for non-admin roles', () => {
    expect(can([ROLES.CUSTOMER], [PERMISSIONS.PRODUCTS_MANAGE], PERMISSIONS.PRODUCTS_MANAGE)).toBe(true);
    expect(can([ROLES.CUSTOMER], [PERMISSIONS.PRODUCTS_MANAGE], PERMISSIONS.ORDERS_MANAGE)).toBe(false);
  });

  it('requires ALL permissions when a list is provided', () => {
    expect(can([ROLES.CUSTOMER], [PERMISSIONS.PRODUCTS_MANAGE, PERMISSIONS.ORDERS_MANAGE], [PERMISSIONS.PRODUCTS_MANAGE, PERMISSIONS.ORDERS_MANAGE])).toBe(true);
    expect(can([ROLES.CUSTOMER], [PERMISSIONS.PRODUCTS_MANAGE], [PERMISSIONS.PRODUCTS_MANAGE, PERMISSIONS.ORDERS_MANAGE])).toBe(false);
  });

  it('maps roles to a default permission set', () => {
    expect(ROLE_PERMISSIONS.CUSTOMER).toEqual([]);
    expect(ROLE_PERMISSIONS.ADMIN).toContain(PERMISSIONS.ADMIN_ACCESS);
  });
});