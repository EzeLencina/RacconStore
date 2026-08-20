import { cn } from '@lib/helpers/cn';
import { formatPrice, Button } from '@tienda/ui';
import { CatalogProductCard } from '@components/catalog';
import { getRelatedProducts } from '../mock-data';
import type { PDPProduct } from '../mock-data';
import type { RelationCard } from '@lib/products/relations';

type CrossSellingProps = {
  product: PDPProduct;
  className?: string;
  items?: RelationCard[];
};

export function CrossSelling({ product, className, items }: CrossSellingProps) {
  const itemsToShow = items ?? getRelatedProducts(product.crossSellSlugs);

  if (itemsToShow.length === 0) return null;

  const isReal = Array.isArray(items);
  const totalPrice = isReal
    ? itemsToShow.reduce((sum, item) => sum + item.price, 0)
    : product.price +
      (itemsToShow as PDPProduct[]).reduce((sum, item) => sum + item.price, 0);

  const toCard = (p: PDPProduct | RelationCard): RelationCard =>
    'crossSellSlugs' in p
      ? {
          ...p,
          brand: '',
          brandSlug: '',
          category: '',
          categorySlug: '',
          subcategory: '',
          subcategorySlug: '',
          images: [],
          image: '',
          originalPrice: undefined,
          discount: undefined,
          rating: 0,
          reviewCount: 0,
          badge: undefined,
          badgeVariant: undefined,
          stockCount: 0,
          isNew: undefined,
          isFeatured: undefined,
          estimatedDelivery: '',
          warranty: '',
          specs: {},
        }
      : p;

  return (
    <section className={cn('space-y-4', className)} aria-labelledby="cross-heading">
      <h2 id="cross-heading" className="text-lg font-semibold tracking-tight">Comprados juntos</h2>

      <div className="rounded-xl border border-border p-4 sm:p-5 space-y-4">
        <p className="text-xs text-muted-foreground">
          Productos que se compran frecuentemente juntos
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {isReal
            ? itemsToShow.map((item) => (
                <CatalogProductCard key={item.id} product={toCard(item)} viewMode="grid" />
              ))
            : (
                <>
                  <CatalogProductCard
                    product={{
                      id: product.id,
                      name: product.name,
                      slug: product.slug,
                      sku: product.sku,
                      brand: product.brand,
                      brandSlug: product.brandSlug,
                      category: product.category,
                      categorySlug: product.categorySlug,
                      subcategory: product.subcategory,
                      subcategorySlug: product.subcategorySlug,
                      price: product.price,
                      originalPrice: product.originalPrice,
                      rating: product.rating,
                      reviewCount: product.reviewCount,
                      image: product.images[0]?.src ?? '',
                      images: product.images.map((i) => i.src),
                      badge: product.badge,
                      badgeVariant: product.badgeVariant,
                      inStock: product.inStock,
                      stockCount: product.stockCount,
                      isNew: product.isNew,
                      isFeatured: product.isFeatured,
                      estimatedDelivery: product.estimatedDelivery,
                      warranty: product.warranty,
                      specs: product.specs,
                    }}
                    viewMode="grid"
                  />
                  {itemsToShow.map((item) => (
                    <CatalogProductCard key={item.id} product={toCard(item)} viewMode="grid" />
                  ))}
                </>
              )}
        </div>

        {totalPrice > 0 ? (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-3 border-t border-border">
            <div>
              <p className="text-xs text-muted-foreground">Precio total:</p>
              <p className="text-xl font-bold text-foreground">{formatPrice(totalPrice)}</p>
            </div>
            <Button size="md" aria-label="Agregar todo al carrito">
              Agregar todo al carrito
            </Button>
          </div>
        ) : null}
      </div>
    </section>
  );
}
