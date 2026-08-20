export type NavPage = {
  id: string;
  name: string;
  href: string;
  icon?: string;
  badge?: string;
  external?: boolean;
};

export type AnnoucementConfig = {
  text: string;
  href?: string;
  cta?: string;
  dismissible?: boolean;
};

export type TopBarConfig = {
  shipping: string;
  installments: string;
  warranty: string;
  support: string;
  promotions: string;
};

export type SocialLink = {
  name: string;
  href: string;
  icon: string;
};

export type PaymentMethod = {
  id: string;
  name: string;
  icon: string;
};

export type ShippingMethod = {
  id: string;
  name: string;
  icon: string;
  description: string;
};

export const mainNavPages: NavPage[] = [
  { id: 'catalog', name: 'Catálogo', href: '/catalogo', icon: 'tag' },
  { id: 'featured', name: 'Destacados', href: '/catalogo/destacados', icon: 'sparkles' },
];

export const accountPages: NavPage[] = [
  { id: 'account', name: 'Mi Cuenta', href: '/account', icon: 'user' },
  { id: 'orders', name: 'Mis Pedidos', href: '/account/orders', icon: 'package' },
  { id: 'favorites', name: 'Favoritos', href: '/account/favorites', icon: 'heart' },
];

export const footerSections = [
  {
    id: 'company',
    title: 'Empresa',
    links: [
      { name: 'Sobre Nosotros', href: '/about' },
      { name: 'Trabajá con Nosotros', href: '/trabaja-con-nosotros' },
      { name: 'Prensa', href: '/prensa' },
      { name: 'Blog', href: '/blog' },
      { name: 'Afiliados', href: '/afiliados' },
    ],
  },
  {
    id: 'help',
    title: 'Ayuda',
    links: [
      { name: 'Centro de Ayuda', href: '/ayuda' },
      { name: 'FAQ', href: '/faq' },
      { name: 'Términos y Condiciones', href: '/terminos' },
      { name: 'Política de Privacidad', href: '/privacidad' },
      { name: 'Reclamos', href: '/reclamos' },
    ],
  },
  {
    id: 'purchases',
    title: 'Compras',
    links: [
      { name: 'Cómo Comprar', href: '/ayuda/como-comprar' },
      { name: 'Medios de Pago', href: '/ayuda/medios-de-pago' },
      { name: 'Envíos', href: '/ayuda/envios' },
      { name: 'Cambios y Devoluciones', href: '/ayuda/cambios' },
      { name: 'Garantía', href: '/ayuda/garantia' },
    ],
  },
  {
    id: 'contact',
    title: 'Contacto',
    links: [
      { name: 'Atención al Cliente', href: '/contacto' },
      { name: 'WhatsApp', href: 'https://wa.me/541234567890', external: true },
      { name: 'Email', href: 'mailto:soporte@tienda.com', external: true },
      { name: 'Soporte Técnico', href: '/soporte' },
      { name: 'Sucursales', href: '/sucursales' },
    ],
  },
];

export const socialLinks: SocialLink[] = [
  { name: 'Instagram', href: 'https://instagram.com', icon: 'instagram' },
  { name: 'Facebook', href: 'https://facebook.com', icon: 'facebook' },
  { name: 'Twitter/X', href: 'https://x.com', icon: 'twitter' },
  { name: 'YouTube', href: 'https://youtube.com', icon: 'youtube' },
  { name: 'TikTok', href: 'https://tiktok.com', icon: 'tiktok' },
  { name: 'LinkedIn', href: 'https://linkedin.com', icon: 'linkedin' },
];

export const paymentMethods: PaymentMethod[] = [
  { id: 'visa', name: 'Visa', icon: 'visa' },
  { id: 'mastercard', name: 'Mastercard', icon: 'mastercard' },
  { id: 'amex', name: 'American Express', icon: 'amex' },
  { id: 'mercadopago', name: 'Mercado Pago', icon: 'mercadopago' },
  { id: 'uala', name: 'Ualá', icon: 'credit-card' },
  { id: 'transferencia', name: 'Transferencia Bancaria', icon: 'building-bank' },
  { id: 'efectivo', name: 'Efectivo', icon: 'banknote' },
];

export const shippingMethods: ShippingMethod[] = [
  { id: 'express', name: 'Express 24hs', icon: 'rocket', description: 'Envío en 24 horas' },
  { id: 'standard', name: 'Estándar', icon: 'truck', description: 'De 3 a 7 días hábiles' },
  { id: 'pickup', name: 'Retiro en Tienda', icon: 'store', description: 'Sin costo adicional' },
  { id: 'free', name: 'Envío Gratis', icon: 'package-check', description: 'Compras mayores a $150.000' },
];

export const announcementConfig: AnnoucementConfig = {
  text: 'ENVÍO GRATIS en compras mayores a $150.000 | 12 CUOTAS SIN INTERÉS con Mercado Pago',
  href: '/catalogo',
  cta: 'Ver catálogo',
  dismissible: true,
};

export const topBarConfig: TopBarConfig = {
  shipping: 'Envíos a todo el país',
  installments: '12 cuotas sin interés',
  warranty: 'Garantía oficial',
  support: 'Soporte técnico especializado',
  promotions: 'Descuentos exclusivos',
};

export const popularSearches = [
  'Cerradura inteligente', 'Cámara de seguridad', 'Videoportero',
  'Control de acceso', 'Domótica', 'Yale', 'Hikvision', 'Cámara IP',
  'Sensor de movimiento', 'Kit de seguridad',
];