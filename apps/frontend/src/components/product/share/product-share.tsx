'use client';

import { useState } from 'react';
import { Share2, Check } from 'lucide-react';
import { cn } from '@lib/helpers/cn';
import type { PDPProduct } from '@lib/storefront/types';

type ProductShareProps = {
  product: PDPProduct;
  className?: string;
};

export function ProductShare({ product, className }: ProductShareProps) {
  const [copied, setCopied] = useState(false);

  const url = typeof window !== 'undefined' ? window.location.href : `/product/${product.slug}`;

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({ title: product.name, url });
    } else {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button
      type="button"
      onClick={handleShare}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        copied ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground hover:text-foreground',
      )}
      aria-label={copied ? 'Enlace copiado' : 'Compartir producto'}
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <Share2 className="h-3.5 w-3.5" />}
      {copied ? 'Copiado' : 'Compartir'}
    </button>
  );
}
