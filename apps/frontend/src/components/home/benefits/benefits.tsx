import { Truck, ShieldCheck, Headphones, Lock, CreditCard, BadgeCheck } from 'lucide-react';
import { cn } from '@lib/helpers/cn';
import { benefits } from '@lib/home';
import { Container } from '@components/layout/containers/container';

type BenefitsProps = {
  className?: string;
};

const iconMap: Record<string, React.ElementType> = {
  truck: Truck,
  'shield-check': ShieldCheck,
  headphones: Headphones,
  lock: Lock,
  'credit-card': CreditCard,
  'badge-check': BadgeCheck,
};

export function Benefits({ className }: BenefitsProps) {
  return (
    <section className={cn('py-12 sm:py-16 border-y border-border', className)}>
      <Container size="xl">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6">
          {benefits.map((benefit) => {
            const Icon = iconMap[benefit.icon] || BadgeCheck;
            return (
              <div
                key={benefit.id}
                className="flex flex-col items-center text-center gap-3 rounded-xl p-4 sm:p-6 transition-colors hover:bg-muted/50"
              >
                <div className="rounded-full bg-primary/10 p-3">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-sm font-semibold text-foreground">{benefit.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{benefit.description}</p>
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
