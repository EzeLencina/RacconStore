import { cn } from '@lib/helpers/cn';
import { SearchX, PackageOpen } from 'lucide-react';
import { Button } from '@tienda/ui';

type CatalogEmptyStateProps = {
  variant?: 'no-results' | 'no-products' | 'error';
  ctaHref?: string;
  className?: string;
};

const content = {
  'no-results': {
    icon: SearchX,
    title: 'Sin resultados',
    description: 'No encontramos productos con los filtros seleccionados. Intentá con otros términos o eliminá algunos filtros.',
    cta: 'Limpiar filtros',
  },
  'no-products': {
    icon: PackageOpen,
    title: 'Próximamente',
    description: 'Todavía no hay productos en esta categoría. Estamos trabajando para traer las mejores marcas.',
    cta: 'Ver catálogo completo',
  },
  error: {
    icon: PackageOpen,
    title: 'Algo salió mal',
    description: 'No pudimos cargar los productos. Por favor, intentá de nuevo más tarde.',
    cta: 'Reintentar',
  },
};

export function CatalogEmptyState({ variant = 'no-results', ctaHref, className }: CatalogEmptyStateProps) {
  const data = content[variant];
  const Icon = data.icon;

  const cta = ctaHref ? (
    <Button variant="outline" className="mt-6" asChild>
      <a href={ctaHref}>{data.cta}</a>
    </Button>
  ) : (
    <Button variant="outline" className="mt-6">
      {data.cta}
    </Button>
  );

  return (
    <div className={cn('flex flex-col items-center justify-center py-16 px-4 text-center', className)}>
      <div className="mb-4 rounded-full bg-muted p-4">
        <Icon className="h-8 w-8 text-muted-foreground" strokeWidth={1.5} />
      </div>
      <h3 className="text-lg font-semibold text-foreground">{data.title}</h3>
      <p className="mt-2 text-sm text-muted-foreground max-w-md">{data.description}</p>
      {cta}
    </div>
  );
}