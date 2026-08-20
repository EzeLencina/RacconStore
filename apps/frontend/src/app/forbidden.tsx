import Link from 'next/link';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { Button } from '@tienda/ui';

export default function ForbiddenPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
      <ShieldAlert className="h-12 w-12 text-destructive" />
      <h1 className="mt-4 text-3xl font-bold tracking-tight">403 — Acceso denegado</h1>
      <p className="mt-2 max-w-md text-muted-foreground">
        No tenés los permisos necesarios para acceder a esta sección.
      </p>
      <div className="mt-6 flex gap-3">
        <Button asChild variant="outline">
          <Link href="/">
            <ArrowLeft className="h-4 w-4" />
            Volver al inicio
          </Link>
        </Button>
      </div>
    </div>
  );
}