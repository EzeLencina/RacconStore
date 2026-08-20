import { cn } from '@lib/helpers/cn';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@tienda/ui';
import type { PDPProduct } from '@lib/storefront/types';

type TechnicalSpecsProps = {
  product: PDPProduct;
  className?: string;
};

export function TechnicalSpecs({ product, className }: TechnicalSpecsProps) {
  const entries = Object.entries(product.specs);

  return (
    <section className={cn('space-y-4', className)} aria-labelledby="specs-heading">
      <h2 id="specs-heading" className="text-lg font-semibold tracking-tight">Especificaciones técnicas</h2>
      <div className="rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-2/5 bg-muted/30">Especificación</TableHead>
              <TableHead className="bg-muted/30">Valor</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.map(([label, value], i) => (
              <TableRow key={label} className={i % 2 === 0 ? 'bg-background' : 'bg-muted/20'}>
                <TableCell className="font-medium text-sm text-muted-foreground">{label}</TableCell>
                <TableCell className="text-sm text-foreground">{value}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}
