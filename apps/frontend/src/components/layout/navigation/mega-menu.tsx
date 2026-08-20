'use client';

import { ChevronDown, ArrowRight } from 'lucide-react';
import { cn } from '@lib/helpers/cn';
import type { StorefrontCategory } from '@lib/storefront/types';

type MegaMenuProps = {
  categories?: StorefrontCategory[];
  activeCategory: string | null;
  onOpen: (id: string) => void;
  onClose: () => void;
  className?: string;
};

export function MegaMenu({
  categories = [],
  activeCategory,
  onOpen,
  onClose,
  className,
}: MegaMenuProps) {
  if (categories.length === 0) return null;

  return (
    <nav className={cn('hidden lg:block', className)} aria-label="Main navigation">
      <ul className="flex items-center gap-1">
        {categories.slice(0, 8).map((category) => (
          <MegaMenuItem
            key={category.id}
            category={category}
            isActive={activeCategory === category.id}
            onOpen={onOpen}
            onClose={onClose}
          />
        ))}
      </ul>
    </nav>
  );
}

type MegaMenuItemProps = {
  category: StorefrontCategory;
  isActive: boolean;
  onOpen: (id: string) => void;
  onClose: () => void;
};

function MegaMenuItem({ category, isActive, onOpen, onClose }: MegaMenuItemProps) {
  const hasChildren = category.children && category.children.length > 0;

  return (
    <li
      className="relative"
      onMouseEnter={() => onOpen(category.id)}
      onMouseLeave={onClose}
    >
      <button
        type="button"
        className={cn(
          'inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
          'hover:bg-accent hover:text-accent-foreground',
          isActive && 'bg-accent text-accent-foreground',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        )}
        aria-expanded={isActive}
        aria-haspopup={hasChildren ? 'dialog' : false}
      >
        {category.name}
        {hasChildren && (
          <ChevronDown className={cn('h-3.5 w-3.5 transition-transform duration-200', isActive && 'rotate-180')} />
        )}
      </button>

      {isActive && hasChildren && (
        <div
          className={cn(
            'absolute left-0 top-full mt-1',
            'w-screen max-w-4xl rounded-2xl border border-border bg-popover p-6 shadow-xl',
            'animate-in fade-in-0 slide-in-from-top-2 duration-200',
            'z-50',
          )}
          role="dialog"
          aria-label={`${category.name} menu`}
        >
          <div className="grid grid-cols-5 gap-6">
            <div className="col-span-4 grid grid-cols-4 gap-6">
              {category.children?.map((sub) => (
                <div key={sub.id}>
                  <a
                    href={sub.href}
                    className="block text-sm font-semibold text-foreground hover:text-primary transition-colors mb-2"
                  >
                    {sub.name}
                  </a>
                  {sub.children && sub.children.length > 0 && (
                    <ul className="space-y-1">
                      {sub.children.map((child) => (
                        <li key={child.id}>
                          <a
                            href={child.href}
                            className="block text-sm text-muted-foreground hover:text-foreground transition-colors rounded-md px-1 py-0.5"
                          >
                            {child.name}
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>

            <div className="col-span-1 space-y-4">
              <a
                href={category.href}
                className="block rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 p-4 text-center"
              >
                <span className="block text-sm font-semibold text-primary">Ver todo</span>
                <span className="block text-xs text-muted-foreground mt-1">{category.name}</span>
              </a>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-border">
            <a
              href={category.href}
              className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
            >
              Ver todos los productos de {category.name}
              <ArrowRight className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      )}
    </li>
  );
}