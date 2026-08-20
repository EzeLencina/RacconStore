export const ROLES = {
  CUSTOMER: 'CUSTOMER',
  ADMIN: 'ADMIN',
} as const;

export type RoleCode = (typeof ROLES)[keyof typeof ROLES];

export const PERMISSIONS = {
  ADMIN_ACCESS: 'admin.access',
  ADMIN_DASHBOARD_VIEW: 'admin.dashboard.view',
  PRODUCTS_MANAGE: 'products.manage',
  PRODUCTS_PUBLISH: 'products.publish',
  PRODUCTS_IMPORT: 'products.import',
  PRODUCTS_EXPORT: 'products.export',
  INVENTORY_MANAGE: 'inventory.manage',
  ORDERS_MANAGE: 'orders.manage',
  CUSTOMERS_MANAGE: 'customers.manage',
  FINANCE_VIEW: 'finance.view',
  SETTINGS_MANAGE: 'settings.manage',
} as const;

export type PermissionCode = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const ADMIN_PERMISSIONS: PermissionCode[] = Object.values(PERMISSIONS);

export const CUSTOMER_PERMISSIONS: PermissionCode[] = [];

export const ROLE_PERMISSIONS: Record<RoleCode, PermissionCode[]> = {
  CUSTOMER: CUSTOMER_PERMISSIONS,
  ADMIN: ADMIN_PERMISSIONS,
};

export function isAdmin(roles: readonly string[]): boolean {
  return roles.includes(ROLES.ADMIN);
}

export function can(
  roles: readonly string[],
  permissions: readonly string[],
  required: PermissionCode | PermissionCode[],
): boolean {
  if (isAdmin(roles)) {
    return true;
  }

  const requiredList = Array.isArray(required) ? required : [required];
  return requiredList.every((code) => permissions.includes(code));
}