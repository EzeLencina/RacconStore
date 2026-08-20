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
    ctaHref: '/catalogo?categoria=camaras-seguridad',
    secondaryCta: 'Ver Destacados',
    secondaryCtaHref: '/catalogo/destacados',
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
    ctaHref: '/catalogo?categoria=domotica',
    secondaryCta: 'Ver Catálogo',
    secondaryCtaHref: '/catalogo',
    image: '/images/hero/office.jpg',
    imageAlt: 'Smart office automation',
    alignment: 'right',
    bgColor: 'from-muted via-background to-primary/5',
  },
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
  { id: 'pb1', title: 'Hot Sale 2025', subtitle: 'Hasta 40% OFF en seguridad inteligente. Las mejores marcas con precios imperdibles.', cta: 'Ver Destacados', ctaHref: '/catalogo/destacados', image: '/images/promos/hot-sale.jpg', imageAlt: 'Hot Sale 2025', bgColor: 'from-primary to-primary/80', textColor: 'text-primary-foreground', campaign: 'Hot Sale' },
  { id: 'pb2', title: 'Black Friday Tech', subtitle: 'Ofertas exclusivas en tecnología para el hogar. Renová tu seguridad al mejor precio.', cta: 'Ver Catálogo', ctaHref: '/catalogo', image: '/images/promos/black-friday.jpg', imageAlt: 'Black Friday Tech', bgColor: 'from-destructive to-destructive/80', textColor: 'text-destructive-foreground', campaign: 'Black Friday' },
];

export const ctaSection = {
  title: '¿Listo para hacer tu hogar más inteligente?',
  description: 'Equipá tu casa con la mejor tecnología en seguridad y domótica. Visitanos, te asesoramos sin compromiso.',
  cta: 'Ver Catálogo',
  ctaHref: '/catalogo',
  secondaryCta: 'Crear Cuenta',
  secondaryCtaHref: '/register',
  image: '/images/cta/smart-home-cta.jpg',
  imageAlt: 'Smart home setup',
};

export const dealsCountdownTarget = '2026-12-31T23:59:59';