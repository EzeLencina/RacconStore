import { Badge } from '@tienda/ui';
import { ShieldCheck } from 'lucide-react';
import { cn } from '@lib/helpers/cn';
import type { PDPProduct } from '@lib/storefront/types';

type ProductInfoProps = {
  product: PDPProduct;
  className?: string;
};

export function ProductInfo({ product, className }: ProductInfoProps) {
  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center gap-2">
        {product.badge && (
          <Badge variant={product.badgeVariant ?? 'default'} size="sm">{product.badge}</Badge>
        )}
        {product.isNew && !product.badge && (
          <Badge variant="info" size="sm">Nuevo</Badge>
        )}
      </div>

      <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-foreground">
        {product.name}
      </h1>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
        <span className="font-medium text-foreground">SKU: {product.sku}</span>
        <span className="text-muted-foreground/50" aria-hidden="true">|</span>
        {product.brandSlug ? (
          <a href={`/catalogo?brand=${product.brandSlug}`} className="hover:text-primary transition-colors font-medium text-foreground">
            {product.brand}
          </a>
        ) : (
          <span className="font-medium text-foreground">{product.brand}</span>
        )}
        <span className="text-muted-foreground/50" aria-hidden="true">|</span>
        <span>Modelo: {product.model}</span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1 rounded-lg border border-success/30 bg-success/5 px-2.5 py-1 text-xs font-medium text-success">
          <ShieldCheck className="h-3.5 w-3.5" />
          Garantía: {product.warranty}
        </span>
        <span className="text-xs text-muted-foreground">
          Código interno: <span className="font-mono">{product.internalCode}</span>
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2 pt-1">
        <span className="text-xs text-muted-foreground font-medium">Categoría:</span>
        <a href={`/categoria/${product.categorySlug}`} className="text-xs hover:text-primary transition-colors">{product.category}</a>
        {product.subcategory && (
          <>
            <span className="text-muted-foreground/50 text-xs" aria-hidden="true">/</span>
            <a href={`/categoria/${product.categorySlug}/${product.subcategorySlug}`} className="text-xs hover:text-primary transition-colors">{product.subcategory}</a>
          </>
        )}
      </div>
    </div>
  );
}
