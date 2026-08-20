import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Package, Warehouse, ShoppingCart, Users, Wallet, Settings, ArrowRight } from 'lucide-react';
import { requireAdmin } from '@lib/auth';
import { ModulePlaceholder } from '@components/admin/module-placeholder';

const MODULES: Record<
  string,
  { title: string; description: string; href: string; icon: typeof Package }
> = {
  productos: {
    title: 'Productos',
    description: 'Gestión del catálogo de productos. Este módulo se implementa en fases posteriores.',
    href: '/admin/productos',
    icon: Package,
  },
  inventario: {
    title: 'Inventario',
    description: 'Control de stock y movimientos. Este módulo se implementa en fases posteriores.',
    href: '/admin/inventario',
    icon: Warehouse,
  },
  pedidos: {
    title: 'Pedidos',
    description: 'Administración de pedidos y cumplimiento. Este módulo se implementa en fases posteriores.',
    href: '/admin/pedidos',
    icon: ShoppingCart,
  },
  clientes: {
    title: 'Clientes',
    description: 'Gestión de clientes y CRM. Este módulo se implementa en fases posteriores.',
    href: '/admin/clientes',
    icon: Users,
  },
  finanzas: {
    title: 'Finanzas',
    description: 'Reportes financieros y facturación. Este módulo se implementa en fases posteriores.',
    href: '/admin/finanzas',
    icon: Wallet,
  },
  configuracion: {
    title: 'Configuración',
    description: 'Configuración general de la tienda. Este módulo se implementa en fases posteriores.',
    href: '/admin/configuracion',
    icon: Settings,
  },
};

const QUICK_LINKS = [
  { href: '/admin/productos', label: 'Productos', icon: Package },
  { href: '/admin/pedidos', label: 'Pedidos', icon: ShoppingCart },
  { href: '/admin/clientes', label: 'Clientes', icon: Users },
];

export default async function AdminIndexPage({
  params,
}: {
  params: Promise<{ slug?: string[] }>;
}) {
  const session = await requireAdmin();
  const { slug } = await params;

  if (!slug || slug.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Hola, {session.name ?? session.email}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Panel de administración — rol: {session.roles.join(', ')}
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {QUICK_LINKS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="group flex items-center justify-between rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/40"
            >
              <span className="flex items-center gap-3">
                <Icon className="h-5 w-5 text-primary" />
                <span className="font-medium">{label}</span>
              </span>
              <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
            </Link>
          ))}
        </div>
      </div>
    );
  }

  const moduleKey = slug[0];
  if (!moduleKey) {
    notFound();
  }

  if (slug.length > 1) {
    notFound();
  }

  const module = MODULES[moduleKey];
  if (!module) {
    notFound();
  }

  return <ModulePlaceholder title={module.title} description={module.description} />;
}