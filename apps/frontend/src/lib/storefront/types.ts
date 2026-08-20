export type StorefrontSortValue = 'relevance' | 'newest' | 'price-asc' | 'price-desc';

export type StorefrontSortOption = {
  value: StorefrontSortValue;
  label: string;
};

export type StorefrontProduct = {
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

export type StorefrontCategory = {
  id: string;
  name: string;
  slug: string;
  href: string;
  productCount: number;
  children?: StorefrontCategory[];
};

export type StorefrontBrand = {
  id: string;
  name: string;
  slug: string;
  href: string;
  logoUrl?: string;
  productCount: number;
};

export type StorefrontProductImage = {
  id: string;
  src: string;
  alt: string;
  width: number;
  height: number;
};

export type StorefrontProductVideo = {
  id: string;
  src: string;
  thumbnail: string;
  type: 'youtube' | 'vimeo' | 'mp4';
};

export type StorefrontProductVariant = {
  id: string;
  type: 'color' | 'finish' | 'version' | 'kit' | 'capacity' | 'model';
  label: string;
  value: string;
  available: boolean;
  image?: string;
};

export type StorefrontProductReview = {
  id: string;
  author: string;
  avatar?: string;
  rating: number;
  date: string;
  title: string;
  comment: string;
  verified: boolean;
  likes: number;
  images?: string[];
};

export type StorefrontProductQuestion = {
  id: string;
  author: string;
  date: string;
  question: string;
  answer?: string;
  answerDate?: string;
  likes: number;
};

export type StorefrontShippingOption = {
  method: string;
  cost: number;
  estimatedDays: string;
};

export type StorefrontPDPProduct = {
  id: string;
  name: string;
  slug: string;
  sku: string;
  brand: string;
  brandSlug: string;
  model: string;
  internalCode: string;
  category: string;
  categorySlug: string;
  subcategory: string;
  subcategorySlug: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  savings?: number;
  installments: { count: number; interest: boolean; installmentPrice: number }[];
  images: StorefrontProductImage[];
  videos: StorefrontProductVideo[];
  status: 'active' | 'draft' | 'discontinued';
  inStock: boolean;
  stockCount: number;
  isNew: boolean;
  isFeatured: boolean;
  badge?: string;
  badgeVariant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  estimatedDelivery: string;
  shipping: StorefrontShippingOption[];
  warranty: string;
  variants: StorefrontProductVariant[];
  shortDescription: string;
  description: string;
  features: string[];
  benefits: string[];
  boxContents: string[];
  installation: string;
  documentation: { label: string; url: string }[];
  specs: Record<string, string>;
  rating: number;
  reviewCount: number;
  reviews: StorefrontProductReview[];
  questions: StorefrontProductQuestion[];
  relatedSlugs: string[];
  crossSellSlugs: string[];
};

export type ProductImage = StorefrontProductImage;
export type ProductVideo = StorefrontProductVideo;
export type ProductVariant = StorefrontProductVariant;
export type ProductReview = StorefrontProductReview;
export type ProductQuestion = StorefrontProductQuestion;
export type ShippingOption = StorefrontShippingOption;
export type PDPProduct = StorefrontPDPProduct;