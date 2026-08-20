export type HomeProduct = {
  id: string;
  name: string;
  slug: string;
  sku: string;
  brand: string;
  category: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  rating: number;
  reviewCount: number;
  image: string;
  badge?: string;
  badgeVariant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  inStock: boolean;
  stockCount?: number;
  featured?: boolean;
  isNew?: boolean;
};

export type HomeCategory = {
  id: string;
  name: string;
  slug: string;
  image: string;
  productCount: number;
  href: string;
};

export type HeroSlide = {
  id: string;
  title: string;
  subtitle: string;
  cta: string;
  ctaHref: string;
  secondaryCta?: string;
  secondaryCtaHref?: string;
  image: string;
  imageAlt: string;
  alignment: 'left' | 'center' | 'right';
  bgColor: string;
};

export type Testimonial = {
  id: string;
  name: string;
  avatar: string;
  role: string;
  rating: number;
  comment: string;
  date: string;
};

export type FaqItem = {
  id: string;
  question: string;
  answer: string;
};

export type Benefit = {
  id: string;
  icon: string;
  title: string;
  description: string;
};

export type Deal = {
  id: string;
  name: string;
  slug: string;
  price: number;
  originalPrice: number;
  discount: number;
  image: string;
  brand: string;
  stockCount: number;
  endsAt: string;
};

export type Brand = {
  id: string;
  name: string;
  slug: string;
  logo: string;
  href: string;
};

export type PromoBanner = {
  id: string;
  title: string;
  subtitle: string;
  cta: string;
  ctaHref: string;
  image: string;
  imageAlt: string;
  bgColor: string;
  textColor: string;
  campaign: string;
};

export const heroSlides: HeroSlide[] = [
  {
    id: '1',
    title: 'Seguridad Inteligente\npara tu Hogar',
    subtitle: 'Descubrí la nueva generación de cerraduras digitales, cámaras HD y domótica. Controlá todo desde tu smartphone.',
    cta: 'Comprar Ahora',
    ctaHref: '/categoria/cerraduras-inteligentes',
    secondaryCta: 'Ver Catálogo',
    secondaryCtaHref: '/catalogo',
    image: '/images/hero/smart-home.jpg',
    imageAlt: 'Smart home security system',
    alignment: 'left',
    bgColor: 'from-primary/5 via-primary/10 to-background',
  },
  {
    id: '2',
    title: 'Protección 24/7\ncon Cámaras HD',
    subtitle: 'Cámaras con visión nocturna, detección de movimiento y almacenamiento en la nube. Tu seguridad, siempre conectada.',
    cta: 'Ver Cámaras',
    ctaHref: '/categoria/camaras-seguridad',
    secondaryCta: 'Ver Ofertas',
    secondaryCtaHref: '/ofertas',
    image: '/images/hero/cameras.jpg',
    imageAlt: 'Security cameras',
    alignment: 'center',
    bgColor: 'from-background to-muted',
  },
  {
    id: '3',
    title: 'Domótica\npara tu Empresa',
    subtitle: 'Control de acceso, videoporteros IP y sistemas integrados para oficinas inteligentes.',
    cta: 'Más Información',
    ctaHref: '/categoria/domotica',
    secondaryCta: 'Contactar',
    secondaryCtaHref: '/contacto',
    image: '/images/hero/office.jpg',
    imageAlt: 'Smart office automation',
    alignment: 'right',
    bgColor: 'from-muted via-background to-primary/5',
  },
];

export const homeCategories: HomeCategory[] = [
  { id: '1', name: 'Cerraduras Inteligentes', slug: 'cerraduras-inteligentes', image: '/images/categories/smart-locks.jpg', productCount: 48, href: '/categoria/cerraduras-inteligentes' },
  { id: '2', name: 'Cámaras de Seguridad', slug: 'camaras-seguridad', image: '/images/categories/security-cameras.jpg', productCount: 72, href: '/categoria/camaras-seguridad' },
  { id: '3', name: 'Videoporteros', slug: 'videoporteros', image: '/images/categories/doorbells.jpg', productCount: 24, href: '/categoria/videoporteros' },
  { id: '4', name: 'Control de Acceso', slug: 'control-acceso', image: '/images/categories/access-control.jpg', productCount: 36, href: '/categoria/control-acceso' },
  { id: '5', name: 'Domótica', slug: 'domotica', image: '/images/categories/smart-home.jpg', productCount: 56, href: '/categoria/domotica' },
  { id: '6', name: 'Accesorios', slug: 'accesorios', image: '/images/categories/accessories.jpg', productCount: 89, href: '/categoria/accesorios' },
];

export const dealProducts: HomeProduct[] = [
  { id: 'd1', name: 'Cerradura Inteligente Yale YRD256', slug: 'cerradura-inteligente-yale-yrd256', sku: 'YRD-256-BLE', brand: 'Yale', category: 'Cerraduras Inteligentes', price: 89999, originalPrice: 112999, discount: 20, rating: 4.5, reviewCount: 128, image: '/images/products/yale-yrd256.jpg', badge: '20% OFF', badgeVariant: 'danger', inStock: true, stockCount: 15 },
  { id: 'd2', name: 'Cámara IP Ezviz C8C Pro 4K', slug: 'camara-ip-ezviz-c8c-pro-4k', sku: 'C8C-PRO-4K', brand: 'Ezviz', category: 'Cámaras de Seguridad', price: 45999, originalPrice: 57999, discount: 21, rating: 4.7, reviewCount: 89, image: '/images/products/ezviz-c8c.jpg', badge: '21% OFF', badgeVariant: 'danger', inStock: true, stockCount: 23 },
  { id: 'd3', name: 'Cámara PTZ Hikvision 5MP', slug: 'camara-ptz-hikvision-5mp', sku: 'DS-2DE5225IW-AE', brand: 'Hikvision', category: 'Cámaras de Seguridad', price: 215999, originalPrice: 269999, discount: 20, rating: 4.8, reviewCount: 112, image: '/images/products/hikvision-ptz.jpg', badge: '20% OFF', badgeVariant: 'danger', inStock: true, stockCount: 11 },
  { id: 'd4', name: 'Cerradura Inteligente Philips Gamma', slug: 'cerradura-inteligente-philips-gamma', sku: 'PH-GAMMA-SL', brand: 'Philips', category: 'Cerraduras Inteligentes', price: 64999, originalPrice: 84999, discount: 24, rating: 4.2, reviewCount: 56, image: '/images/products/philips-gamma.jpg', badge: '24% OFF', badgeVariant: 'danger', inStock: true, stockCount: 19 },
];

export const brands: Brand[] = [
  { id: 'b1', name: 'Yale', slug: 'yale', logo: '/images/brands/yale.svg', href: '/marca/yale' },
  { id: 'b2', name: 'Philips', slug: 'philips', logo: '/images/brands/philips.svg', href: '/marca/philips' },
  { id: 'b3', name: 'Samsung', slug: 'samsung', logo: '/images/brands/samsung.svg', href: '/marca/samsung' },
  { id: 'b4', name: 'Intelbras', slug: 'intelbras', logo: '/images/brands/intelbras.svg', href: '/marca/intelbras' },
  { id: 'b5', name: 'Ezviz', slug: 'ezviz', logo: '/images/brands/ezviz.svg', href: '/marca/ezviz' },
  { id: 'b6', name: 'Dahua', slug: 'dahua', logo: '/images/brands/dahua.svg', href: '/marca/dahua' },
  { id: 'b7', name: 'Hikvision', slug: 'hikvision', logo: '/images/brands/hikvision.svg', href: '/marca/hikvision' },
  { id: 'b8', name: 'TP-Link', slug: 'tp-link', logo: '/images/brands/tplink.svg', href: '/marca/tp-link' },
];

export const benefits: Benefit[] = [
  { id: 'be1', icon: 'truck', title: 'Envíos Rápidos', description: 'Entregas en 24hs en CABA y GBA. Envíos a todo el país.' },
  { id: 'be2', icon: 'shield-check', title: 'Garantía Oficial', description: 'Todos nuestros productos cuentan con garantía oficial de fábrica.' },
  { id: 'be3', icon: 'headphones', title: 'Soporte Técnico', description: 'Expertos listos para ayudarte antes, durante y después de tu compra.' },
  { id: 'be4', icon: 'lock', title: 'Pagos Seguros', description: 'Compra protegida con los más altos estándares de seguridad.' },
  { id: 'be5', icon: 'credit-card', title: 'Hasta 12 Cuotas', description: 'Financiación con Mercado Pago, Visa, Mastercard y más.' },
  { id: 'be6', icon: 'badge-check', title: 'Compra Protegida', description: 'Reintegro garantizado si el producto no llega o no es lo que esperabas.' },
];

export const testimonials: Testimonial[] = [
  { id: 't1', name: 'María García', avatar: '/images/avatars/woman-1.jpg', role: 'Ingeniera', rating: 5, comment: 'Excelente atención y productos de primera calidad. La cerradura inteligente que compré superó todas mis expectativas.', date: '2024-12-15' },
  { id: 't2', name: 'Carlos Rodríguez', avatar: '/images/avatars/man-1.jpg', role: 'Arquitecto', rating: 5, comment: 'Recomiendo totalmente. Instalé el sistema de videoportero IP en un edificio completo y funcionó perfectamente.', date: '2024-11-28' },
  { id: 't3', name: 'Ana Martínez', avatar: '/images/avatars/woman-2.jpg', role: 'Dueña de Casa', rating: 4, comment: 'Muy buena experiencia. Las cámaras Ezviz tienen una calidad de imagen increíble. Fácil instalación.', date: '2024-11-10' },
  { id: 't4', name: 'Pablo Fernández', avatar: '/images/avatars/man-2.jpg', role: 'IT Manager', rating: 5, comment: 'Implementamos control de acceso biométrico para nuestra oficina. El soporte técnico fue excepcional.', date: '2024-10-22' },
];

export const faqItems: FaqItem[] = [
  { id: 'f1', question: '¿Qué métodos de pago aceptan?', answer: 'Aceptamos todas las tarjetas de crédito y débito (Visa, Mastercard, American Express), Mercado Pago, transferencia bancaria y efectivo. Podés financiar tus compras hasta en 12 cuotas sin interés con Mercado Pago.' },
  { id: 'f2', question: '¿Cuánto tarda el envío?', answer: 'Para CABA y GBA ofrecemos envío express en 24 horas. Para el resto del país, el tiempo estimado es de 3 a 7 días hábiles. Todos los envíos incluyen seguro y tracking.' },
  { id: 'f3', question: '¿Cómo funcionan las garantías?', answer: 'Todos los productos cuentan con garantía oficial del fabricante. Los plazos varían según la marca (generalmente 12 meses). En caso de falla, gestionamos el reclamo directamente con el fabricante sin costo.' },
  { id: 'f4', question: '¿Puedo cambiar o devolver un producto?', answer: 'Sí, tenés 30 días desde la recepción para solicitar un cambio o devolución. El producto debe estar en su embalaje original y en perfecto estado. Iniciamos el proceso dentro de las 48 horas.' },
  { id: 'f5', question: '¿Ofrecen instalación?', answer: 'Sí, contamos con servicio de instalación para cerraduras inteligentes, cámaras y sistemas de control de acceso. El servicio se coordina después de la compra y tiene un costo adicional.' },
  { id: 'f6', question: '¿Cómo puedo contactar a soporte técnico?', answer: 'Podés contactarnos por WhatsApp, email o telefónicamente. Nuestro horario de atención es lunes a viernes de 9 a 20 hs y sábados de 10 a 18 hs. Respondemos consultas en menos de 1 hora.' },
];

export const promoBanners: PromoBanner[] = [
  { id: 'pb1', title: 'Hot Sale 2025', subtitle: 'Hasta 40% OFF en seguridad inteligente. Las mejores marcas con precios imperdibles.', cta: 'Ver Ofertas', ctaHref: '/ofertas', image: '/images/promos/hot-sale.jpg', imageAlt: 'Hot Sale 2025', bgColor: 'from-primary to-primary/80', textColor: 'text-primary-foreground', campaign: 'Hot Sale' },
  { id: 'pb2', title: 'Black Friday Tech', subtitle: 'Ofertas exclusivas en tecnología para el hogar. Renová tu seguridad al mejor precio.', cta: 'Aprovechar', ctaHref: '/ofertas', image: '/images/promos/black-friday.jpg', imageAlt: 'Black Friday Tech', bgColor: 'from-destructive to-destructive/80', textColor: 'text-destructive-foreground', campaign: 'Black Friday' },
];

export const ctaSection = {
  title: '¿Listo para hacer tu hogar más inteligente?',
  description: 'Equipá tu casa con la mejor tecnología en seguridad y domótica. Visitanos, te asesoramos sin compromiso.',
  cta: 'Hablar con un Asesor',
  ctaHref: '/contacto',
  secondaryCta: 'Ver Catálogo',
  secondaryCtaHref: '/catalogo',
  image: '/images/cta/smart-home-cta.jpg',
  imageAlt: 'Smart home setup',
};
