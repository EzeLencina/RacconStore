import { requireAdmin } from '@lib/auth';
import { can, PERMISSIONS, type PermissionCode } from '@lib/auth/rbac';
import { navigationConfig } from '@config/navigation.config';
import { AdminShell, type AdminNavItem } from '@components/admin/admin-shell';

const NAV_PERMISSION: Record<string, PermissionCode> = {
  '/admin': PERMISSIONS.ADMIN_DASHBOARD_VIEW,
  '/admin/productos': PERMISSIONS.PRODUCTS_MANAGE,
  '/admin/categorias': PERMISSIONS.PRODUCTS_MANAGE,
  '/admin/marcas': PERMISSIONS.PRODUCTS_MANAGE,
  '/admin/colecciones': PERMISSIONS.PRODUCTS_MANAGE,
  '/admin/atributos': PERMISSIONS.PRODUCTS_MANAGE,
  '/admin/imports': PERMISSIONS.PRODUCTS_IMPORT,
  '/admin/inventario': PERMISSIONS.INVENTORY_MANAGE,
  '/admin/pedidos': PERMISSIONS.ORDERS_MANAGE,
  '/admin/clientes': PERMISSIONS.CUSTOMERS_MANAGE,
  '/admin/finanzas': PERMISSIONS.FINANCE_VIEW,
  '/admin/configuracion': PERMISSIONS.SETTINGS_MANAGE,
};

export default async function AdminRouteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAdmin();

  const navItems: AdminNavItem[] = navigationConfig.admin.filter((item) =>
    can(session.roles, session.permissions, NAV_PERMISSION[item.href] ?? PERMISSIONS.ADMIN_DASHBOARD_VIEW),
  );

  return (
    <AdminShell user={session} navItems={navItems}>
      {children}
    </AdminShell>
  );
}