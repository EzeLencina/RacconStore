import type { ReactNode } from 'react';
import Link from 'next/link';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@tienda/ui';

type AuthCardProps = {
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
};

export function AuthCard({ title, description, children, footer }: AuthCardProps) {
  return (
    <Card className="w-full">
      <CardHeader className="text-center">
        <Link href="/" className="text-xl font-bold tracking-tight text-primary">
          Tienda
        </Link>
        <CardTitle className="mt-2">{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      <CardContent>{children}</CardContent>
      {footer ? (
        <CardFooter className="justify-center border-t border-border pt-4">
          {footer}
        </CardFooter>
      ) : null}
    </Card>
  );
}