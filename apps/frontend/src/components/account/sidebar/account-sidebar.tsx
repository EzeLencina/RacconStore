'use client';

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard, ShoppingBag, MapPin, Heart, Star,
  LifeBuoy, ShieldCheck, Bell, Settings, LogOut, X,
} from 'lucide-react';
import { cn } from '@lib/helpers/cn';

const links = [
  { href: '/account', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/account/profile', label: 'Mi perfil', icon: Heart },
  { href: '/account/orders', label: 'Mis pedidos', icon: ShoppingBag },
  { href: '/account/addresses', label: 'Direcciones', icon: MapPin },
  { href: '/account/favorites', label: 'Favoritos', icon: Star },
  { href: '/account/reviews', label: 'Reseñas', icon: Star },
  { href: '/account/support', label: 'Soporte', icon: LifeBuoy },
  { href: '/account/warranties', label: 'Garantías', icon: ShieldCheck },
  { href: '/account/notifications', label: 'Notificaciones', icon: Bell },
  { href: '/account/settings', label: 'Configuración', icon: Settings },
];

type AccountSidebarProps = { mobileOpen?: boolean; onClose?: () => void };

export function AccountSidebar({ mobileOpen, onClose }: AccountSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      onClose?.();
      router.push('/');
      router.refresh();
    }
  }

  return (
    <>
      {mobileOpen && <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={onClose} aria-hidden="true" />}

      <aside
        className={cn(
          'w-full lg:w-60 shrink-0',
          'fixed lg:sticky top-0 lg:top-24 left-0 z-50 lg:z-0',
          'h-full lg:h-auto',
          'bg-background lg:bg-transparent',
          'overflow-y-auto',
          'transform transition-transform duration-300 lg:transform-none',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        )}
        aria-label="Navegación de cuenta"
      >
        <div className="flex items-center justify-between p-4 lg:hidden border-b border-border">
          <span className="text-sm font-semibold">Menú</span>
          <button type="button" onClick={onClose} className="rounded-lg p-2 hover:bg-accent" aria-label="Cerrar menú">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="p-2 lg:p-0 space-y-0.5">
          {links.map((link) => {
            const active = pathname === link.href || (link.href !== '/account' && pathname.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={onClose}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors',
                  active ? 'bg-primary/10 text-primary font-semibold' : 'text-muted-foreground hover:text-foreground hover:bg-accent',
                )}
                aria-current={active ? 'page' : undefined}
              >
                <link.icon className="h-4 w-4 shrink-0" />
                {link.label}
              </Link>
            );
          })}
          <hr className="my-2 border-border" />
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            Cerrar sesión
          </button>
        </nav>
      </aside>
    </>
  );
}
