import { X } from 'lucide-react';
import { cn } from '@lib/helpers/cn';
import { Button } from '@tienda/ui';

type ActiveFilter = {
  id: string;
  label: string;
  removeHref: string;
};

type ActiveFiltersProps = {
  filters?: ActiveFilter[];
  clearHref: string;
  className?: string;
};

export function ActiveFilters({ filters = [], clearHref, className }: ActiveFiltersProps) {
  if (filters.length === 0) return null;

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      <span className="text-xs text-muted-foreground font-medium">Filtros activos:</span>
      {filters.map((f) => (
        <a
          key={f.id}
          href={f.removeHref}
          className="inline-flex items-center gap-1 rounded-full border border-border bg-accent/50 px-2.5 py-1 text-xs font-medium"
        >
          {f.label}
          <span className="ml-0.5 rounded-sm p-0.5 hover:bg-accent transition-colors" aria-hidden="true">
            <X className="h-3 w-3" />
          </span>
        </a>
      ))}
      <Button variant="ghost" size="xs" asChild className="text-xs text-muted-foreground">
        <a href={clearHref}>Limpiar todos</a>
      </Button>
    </div>
  );
}