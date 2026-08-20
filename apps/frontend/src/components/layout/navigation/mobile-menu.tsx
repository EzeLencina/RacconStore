'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { X, ChevronDown, LogOut } from 'lucide-react';
import { cn } from '@lib/helpers/cn';
import { mainNavPages, accountPages } from '@lib/layout/navigation';
import type { StorefrontCategory } from '@lib/storefront/types';

type MobileMenuProps = {
  isOpen: boolean;
  onClose: () => void;
  categories?: StorefrontCategory[];
};

export function MobileMenu({ isOpen, onClose, categories = [] }: MobileMenuProps) {
  const router = useRouter();
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [expandedSub, setExpandedSub] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      setExpandedCategory(null);
      setExpandedSub(null);
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const toggleCategory = (id: string) => {
    setExpandedCategory((prev) => (prev === id ? null : id));
    setExpandedSub(null);
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <div
        className={cn(
          'fixed top-0 left-0 z-50 h-full w-full max-w-sm bg-background shadow-xl lg:hidden',
          'transform transition-transform duration-300 ease-in-out',
          isOpen ? 'translate-x-0' : '-translate-x-full',
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <span className="text-lg font-semibold">Menú</span>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 hover:bg-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="px-4 py-4 space-y-1">
              {categories.map((cat) => (
                <MobileCategoryItem
                  key={cat.id}
                  category={cat}
                  isExpanded={expandedCategory === cat.id}
                  expandedSub={expandedSub}
                  onToggle={toggleCategory}
                  onToggleSub={setExpandedSub}
                  onNavigate={onClose}
                />
              ))}
            </div>

            <div className="border-t border-border px-4 py-4 space-y-1">
              {mainNavPages.map((page) => (
                <a
                  key={page.id}
                  href={page.href}
                  onClick={onClose}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {page.name}
                </a>
              ))}
            </div>

            <div className="border-t border-border px-4 py-4 space-y-1">
              <span className="px-3 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">Cuenta</span>
              {accountPages.map((page) => (
                <a
                  key={page.id}
                  href={page.href}
                  onClick={onClose}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {page.name}
                </a>
              ))}
              <button
                type="button"
                onClick={async () => {
                  try {
                    await fetch('/api/auth/logout', { method: 'POST' });
                  } finally {
                    onClose();
                    router.push('/');
                    router.refresh();
                  }
                }}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <LogOut className="h-4 w-4" />
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

type MobileCategoryItemProps = {
  category: StorefrontCategory;
  isExpanded: boolean;
  expandedSub: string | null;
  onToggle: (id: string) => void;
  onToggleSub: (id: string | null) => void;
  onNavigate: () => void;
};

function MobileCategoryItem({ category, isExpanded, expandedSub, onToggle, onToggleSub, onNavigate }: MobileCategoryItemProps) {
  const hasChildren = category.children && category.children.length > 0;

  return (
    <div>
      <button
        type="button"
        onClick={() => hasChildren && onToggle(category.id)}
        className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <a
          href={category.href}
          onClick={(e) => {
            if (hasChildren) e.preventDefault();
            else onNavigate();
          }}
          className="flex-1 text-left"
        >
          {category.name}
        </a>
        {hasChildren && (
          <ChevronDown className={cn('h-4 w-4 transition-transform duration-200', isExpanded && 'rotate-180')} />
        )}
      </button>

      {isExpanded && hasChildren && (
        <div className="ml-4 mt-1 space-y-1 border-l-2 border-border pl-3">
          {category.children?.map((sub) => (
            <div key={sub.id}>
              <button
                type="button"
                onClick={() => sub.children?.length ? onToggleSub(expandedSub === sub.id ? null : sub.id) : onNavigate()}
                className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <a
                  href={sub.href}
                  onClick={(e) => {
                    if (sub.children?.length) e.preventDefault();
                  }}
                >
                  {sub.name}
                </a>
                {sub.children && sub.children.length > 0 && (
                  <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', expandedSub === sub.id && 'rotate-180')} />
                )}
              </button>
              {expandedSub === sub.id && sub.children && (
                <div className="ml-4 mt-1 space-y-1">
                  {sub.children.map((child) => (
                    <a
                      key={child.id}
                      href={child.href}
                      onClick={onNavigate}
                      className="block rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {child.name}
                    </a>
                  ))}
                </div>
              )}
            </div>
          ))}
          <a
            href={category.href}
            onClick={onNavigate}
            className="block rounded-lg px-3 py-2 text-sm font-medium text-primary hover:bg-primary/10 transition-colors"
          >
            Ver todo en {category.name}
          </a>
        </div>
      )}
    </div>
  );
}