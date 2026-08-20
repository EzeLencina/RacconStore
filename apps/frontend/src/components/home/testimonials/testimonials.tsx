import { cn } from '@lib/helpers/cn';
import { testimonials } from '@lib/home';
import { Container } from '@components/layout/containers/container';
import { SectionTitle, Avatar, AvatarImage, AvatarFallback, Rating } from '@tienda/ui';
import { formatPrice } from '@tienda/ui';

type TestimonialsProps = {
  className?: string;
};

export function Testimonials({ className }: TestimonialsProps) {
  return (
    <section className={cn('py-12 sm:py-16', className)}>
      <Container size="xl">
        <SectionTitle
          title="Lo Que Dicen Nuestros Clientes"
          description="Más de 15.000 clientes confían en nosotros"
          align="center"
          spacing="loose"
        />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {testimonials.map((t) => (
            <article
              key={t.id}
              className="rounded-xl border border-border bg-background p-6 transition-all duration-200 hover:shadow-md"
            >
              <div className="flex items-center gap-3 mb-4">
                <Avatar size="md">
                  <AvatarImage src={t.avatar} alt={t.name} />
                  <AvatarFallback>{t.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium text-foreground">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </div>
              <Rating value={t.rating} size="sm" className="mb-3" />
              <blockquote className="text-sm text-muted-foreground leading-relaxed">
                &ldquo;{t.comment}&rdquo;
              </blockquote>
              <p className="mt-3 text-xs text-muted-foreground">{t.date}</p>
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
}
