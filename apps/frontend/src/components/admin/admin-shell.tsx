'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  Warehouse,
  ShoppingCart,
  Users,
  Wallet,
  Settings,
  LogOut,
  Menu,
  X,
  FileUp,
  LayoutList,
  Tag,
  Layers,
  Tags,
} from 'lucide-react';
import { cn } from '@lib/helpers/cn';
import { Button } from '@tienda/ui';
import type { SessionUser } from '@lib/auth/session';

export type AdminNavItem = {
  label: string;
  href: string;
  icon: string;
};

const ICONS: Record<string, typeof LayoutDashboard> = {
  LayoutDashboard,
  Package,
  Warehouse,
  ShoppingCart,
  Users,
  Wallet,
  Settings,
  FileUp,
  LayoutList,
  Tag,
  Layers,
  Tags,
};

type AdminShellProps = {
  user: SessionUser;
  navItems: AdminNavItem[];
  children: React.ReactNode;
};

export function AdminShell({ user, navItems, children }: AdminShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      router.push('/');
      router.refresh();
    }
  }

  const navigation = (
    <nav className="flex-1 space-y-1 px-3 py-4">
      {navItems.map((item) => {
        const Icon = ICONS[item.icon] ?? LayoutDashboard;
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setMobileOpen(false)}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              active
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-muted/30">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-border bg-card lg:flex">
        <div className="flex h-16 items-center border-b border-border px-6">
          <Link href="/admin" className="text-lg font-bold tracking-tight text-primary">
            Tienda Admin
          </Link>
        </div>
        {navigation}
        <div className="border-t border-border p-4">
          <div className="mb-3 px-1">
            <p className="truncate text-sm font-medium text-foreground">{user.name ?? 'Admin'}</p>
            <p className="truncate text-xs text-muted-foreground">{user.email}</p>
          </div>
          <Button variant="outline" size="sm" fullWidth onClick={handleLogout} disabled={loggingOut}>
            <LogOut className="h-4 w-4" />
            {loggingOut ? 'Saliendo…' : 'Cerrar sesión'}
          </Button>
        </div>
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-64 flex-col bg-card">
            <div className="flex h-16 items-center justify-between border-b border-border px-6">
              <Link href="/admin" className="text-lg font-bold tracking-tight text-primary">
                Tienda Admin
              </Link>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-accent"
                aria-label="Cerrar menú"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {navigation}
            <div className="border-t border-border p-4">
              <Button variant="outline" size="sm" fullWidth onClick={handleLogout} disabled={loggingOut}>
                <LogOut className="h-4 w-4" />
                {loggingOut ? 'Saliendo…' : 'Cerrar sesión'}
              </Button>
            </div>
          </aside>
        </div>
      ) : null}

      <div className="lg:pl-64">
        <header className="flex h-16 items-center justify-between border-b border-border bg-card px-4 sm:px-6">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="rounded-lg p-2 text-muted-foreground hover:bg-accent lg:hidden"
            aria-label="Abrir menú"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="ml-auto flex items-center gap-3">
            <span className="hidden text-sm text-muted-foreground sm:block">{user.email}</span>
            <Button variant="ghost" size="sm" onClick={handleLogout} disabled={loggingOut}>
              <LogOut className="h-4 w-4" />
              <span className="lg:hidden">Salir</span>
            </Button>
          </div>
        </header>
        <main className="p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}