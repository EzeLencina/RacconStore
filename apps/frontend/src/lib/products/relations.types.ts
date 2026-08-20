export type ProductRelationTypeValue = 'RELATED' | 'ALTERNATIVE' | 'COMPLEMENTARY';

export const RELATION_TYPES: Record<
  ProductRelationTypeValue,
  { label: string; description: string }
> = {
  RELATED: { label: 'Relacionados', description: 'Productos similares o relacionados' },
  ALTERNATIVE: { label: 'Alternativos', description: 'Alternativas equivalentes para la misma necesidad' },
  COMPLEMENTARY: { label: 'Complementarios', description: 'Productos que se compran juntos' },
};

export type RelationCard = {
  id: string;
  name: string;
  slug: string;
  sku: string;
  brand: string;
  brandSlug: string;
  category: string;
  categorySlug: string;
  subcategory: string;
  subcategorySlug: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  rating: number;
  reviewCount: number;
  image: string;
  images: string[];
  badge?: string;
  badgeVariant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  inStock: boolean;
  stockCount: number;
  isNew?: boolean;
  isFeatured?: boolean;
  estimatedDelivery: string;
  warranty: string;
  specs: Record<string, string>;
};

export function toRelationCard(product: {
  id: string;
  name: string;
  slug: string;
  status: string;
}): RelationCard {
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    sku: '',
    brand: '',
    brandSlug: '',
    category: '',
    categorySlug: '',
    subcategory: '',
    subcategorySlug: '',
    price: 0,
    rating: 0,
    reviewCount: 0,
    image: '',
    images: [],
    inStock: product.status === 'ACTIVE',
    stockCount: 0,
    estimatedDelivery: '',
    warranty: '',
    specs: {},
  };
}