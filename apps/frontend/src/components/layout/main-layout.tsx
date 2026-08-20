import type { ReactNode } from 'react';
import { Header } from './header/header';
import { Footer } from './footer/footer';
import { SkipToContent } from './skip-to-content';
import type { StorefrontCategory } from '@lib/storefront/types';

type MainLayoutProps = {
  children: ReactNode;
  showAnnouncement?: boolean;
  showTopBar?: boolean;
  hideOnScroll?: boolean;
  showNewsletter?: boolean;
  categories?: StorefrontCategory[];
};

export function MainLayout({
  children,
  showAnnouncement = true,
  showTopBar = true,
  hideOnScroll = true,
  showNewsletter = true,
  categories,
}: MainLayoutProps) {
  return (
    <>
      <SkipToContent />
      <Header
        showAnnouncement={showAnnouncement}
        showTopBar={showTopBar}
        hideOnScroll={hideOnScroll}
        categories={categories}
      />
      <main id="main-content" className="min-h-screen">
        {children}
      </main>
      <Footer showNewsletter={showNewsletter} />
    </>
  );
}