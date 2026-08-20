'use client';

import { useState } from 'react';
import { ShoppingCart, Heart, User, Menu, Store } from 'lucide-react';
import { cn } from '@lib/helpers/cn';
import { useMegaMenu } from '../hooks/use-mega-menu';
import { Container } from '../containers/container';
import { SearchBar } from '../search/search-bar';
import { MegaMenu } from '../navigation/mega-menu';
import { MobileMenu } from '../navigation/mobile-menu';
import { AnnouncementBar } from '../announcement/announcement-bar';
import { TopBar } from '../navigation/top-bar';
import { announcementConfig, mainNavPages } from '@lib/layout/navigation';
import type { StorefrontCategory } from '@lib/storefront/types';

export type HeaderProps = {
  className?: string;
  showAnnouncement?: boolean;
  showTopBar?: boolean;
  hideOnScroll?: boolean;
  categories?: StorefrontCategory[];
};

export function Header({
  className,
  showAnnouncement = true,
  showTopBar = true,
  hideOnScroll = true,
  categories,
}: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { activeCategory, open: openMega, close: closeMega } = useMegaMenu();

  const cartCount = 0;
  const favoritesCount = 0;

  return (
    <>
      {showAnnouncement && <AnnouncementBar config={announcementConfig} />}
      {showTopBar && <TopBar />}

      <header
        className={cn(
          'sticky top-0 z-30 w-full border-b border-border bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/80',
          className,
        )}
      >
        <Container size="xl">
          <div className="flex h-16 items-center gap-4 lg:gap-6">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="inline-flex lg:hidden items-center justify-center rounded-lg p-2 hover:bg-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>

            <a href="/" className="flex items-center gap-2 shrink-0" aria-label="Tienda - Home">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <Store className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="hidden sm:inline text-lg font-bold tracking-tight">Tienda</span>
            </a>

            <div className="hidden lg:flex flex-1 justify-center">
              <SearchBar />
            </div>

            <nav className="hidden lg:flex items-center gap-1">
              {mainNavPages.slice(0, 2).map((page) => (
                <a
                  key={page.id}
                  href={page.href}
                  className="rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {page.name}
                </a>
              ))}
            </nav>

            <div className="flex items-center gap-1">
              <a
                href="/account"
                className="hidden sm:inline-flex items-center justify-center rounded-lg p-2 hover:bg-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Mi cuenta"
              >
                <User className="h-5 w-5" />
              </a>

              <a
                href="/account/favorites"
                className="relative hidden sm:inline-flex items-center justify-center rounded-lg p-2 hover:bg-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Favoritos"
              >
                <Heart className="h-5 w-5" />
                {favoritesCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                    {favoritesCount}
                  </span>
                )}
              </a>

              <a
                href="/cart"
                className="relative inline-flex items-center justify-center rounded-lg p-2 hover:bg-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label={`Carrito${cartCount > 0 ? `, ${cartCount} productos` : ''}`}
              >
                <ShoppingCart className="h-5 w-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 min-w-[16px] items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground px-0.5">
                    {cartCount > 99 ? '99+' : cartCount}
                  </span>
                )}
              </a>
            </div>
          </div>

          <div className="hidden lg:flex pb-2">
            <MegaMenu
              categories={categories}
              activeCategory={activeCategory}
              onOpen={openMega}
              onClose={closeMega}
            />
          </div>

          <div className="lg:hidden pb-3">
            <SearchBar />
          </div>
        </Container>
      </header>

      <MobileMenu isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} categories={categories} />
    </>
  );
}