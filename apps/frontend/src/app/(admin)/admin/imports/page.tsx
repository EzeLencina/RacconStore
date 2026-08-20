import type { Metadata } from 'next';
import { Download } from 'lucide-react';
import { requirePermission } from '@lib/auth';
import { PERMISSIONS } from '@lib/auth/rbac';
import { Button } from '@tienda/ui';
import { ImportManager } from '@components/admin/imports/import-manager';

export const metadata: Metadata = {
  title: 'Importar | Admin',
  robots: { index: false, follow: false },
};

export default async function AdminImportsPage() {
  await requirePermission(PERMISSIONS.PRODUCTS_IMPORT);

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Importar / Exportar</h1>
          <a href="/api/admin/products/export">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4" /> Exportar catálogo (CSV)
            </Button>
          </a>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Importá productos por CSV con previsualización y validación por fila antes de aplicar cambios.
        </p>
      </div>

      <ImportManager />
    </div>
  );
}