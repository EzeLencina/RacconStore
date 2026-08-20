import { cn } from '@lib/helpers/cn';
import { faqItems } from '@lib/home';
import { Container } from '@components/layout/containers/container';
import { SectionTitle, Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@tienda/ui';

type FaqProps = {
  className?: string;
};

export function Faq({ className }: FaqProps) {
  return (
    <section className={cn('py-12 sm:py-16 bg-muted/30', className)} aria-label="Preguntas frecuentes">
      <Container size="lg">
        <SectionTitle
          title="Preguntas Frecuentes"
          description="Todo lo que necesitás saber antes de comprar"
          align="center"
          spacing="loose"
        />
        <div className="mx-auto max-w-3xl">
          <Accordion type="single" collapsible className="w-full">
            {faqItems.map((item) => (
              <AccordionItem key={item.id} value={item.id}>
                <AccordionTrigger className="text-left text-sm font-medium">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground leading-relaxed">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </Container>
    </section>
  );
}
