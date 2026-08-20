import { cn } from '@lib/helpers/cn';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@tienda/ui';
import type { PDPProduct } from '@lib/storefront/types';

type ProductDescriptionProps = {
  product: PDPProduct;
  className?: string;
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-foreground mb-2">{title}</h3>
      {children}
    </div>
  );
}

export function ProductDescription({ product, className }: ProductDescriptionProps) {
  return (
    <section className={cn('space-y-4', className)} aria-labelledby="desc-heading">
      <h2 id="desc-heading" className="text-lg font-semibold tracking-tight">Descripción del producto</h2>

      <Accordion type="multiple" defaultValue={['description', 'features', 'benefits', 'box', 'installation', 'docs']}>
        <AccordionItem value="description">
          <AccordionTrigger>Descripción comercial</AccordionTrigger>
          <AccordionContent>
            <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
              {product.description}
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="features">
          <AccordionTrigger>Características ({product.features.length})</AccordionTrigger>
          <AccordionContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {product.features.map((f, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden="true" />
                  {f}
                </li>
              ))}
            </ul>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="benefits">
          <AccordionTrigger>Beneficios ({product.benefits.length})</AccordionTrigger>
          <AccordionContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {product.benefits.map((b, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-success" aria-hidden="true" />
                  {b}
                </li>
              ))}
            </ul>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="box">
          <AccordionTrigger>Contenido de la caja ({product.boxContents.length} items)</AccordionTrigger>
          <AccordionContent>
            <ul className="space-y-1.5 text-sm text-muted-foreground">
              {product.boxContents.map((item, i) => (
                <li key={i} className="flex items-center gap-2">
                  <span className="text-muted-foreground/50">•</span>
                  {item}
                </li>
              ))}
            </ul>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="installation">
          <AccordionTrigger>Instalación</AccordionTrigger>
          <AccordionContent>
            <p className="text-sm text-muted-foreground leading-relaxed">{product.installation}</p>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="docs">
          <AccordionTrigger>Documentación ({product.documentation.length} archivos)</AccordionTrigger>
          <AccordionContent>
            <ul className="space-y-2 text-sm">
              {product.documentation.map((doc, i) => (
                <li key={i}>
                  <a
                    href={doc.url}
                    className="inline-flex items-center gap-1.5 text-primary hover:text-primary/80 transition-colors"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    {doc.label}
                  </a>
                </li>
              ))}
            </ul>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </section>
  );
}
