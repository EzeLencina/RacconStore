const DEFAULT_TENANT_ID = 'default';

export function getTenantId(): string {
  return (
    process.env['TIENDA_DEFAULT_TENANT_ID'] ??
    process.env['DEFAULT_TENANT_ID'] ??
    DEFAULT_TENANT_ID
  );
}