import type { Metadata } from 'next';
import Link from 'next/link';
import { Tags } from 'lucide-react';
import { requirePermission } from '@lib/auth';
import { PERMISSIONS } from '@lib/auth/rbac';
import { getTenantId } from '@lib/auth/tenant';
import { prisma } from '@lib/auth/prisma';
import { listVariantAttributeKeys } from '@lib/catalog/catalog';

export const metadata: Metadata = {
  title: 'Atributos | Admin',
  robots: { index: false, follow: false },
};

export default async function AdminAttributesPage() {
  await requirePermission(PERMISSIONS.PRODUCTS_MANAGE);

  const tenantId = getTenantId();
  const [keys, variantCount] = await Promise.all([
    listVariantAttributeKeys(tenantId),
    prisma.productVariant.count({ where: { tenantId, deletedAt: null } }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Atributos</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Claves de atributos usadas en las variantes del catálogo. Los atributos se asignan por variante desde el
          editor de producto.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card">
        <div className="border-b border-border px-5 py-3">
          <span className="text-sm font-medium text-foreground">
            {keys.length} {keys.length === 1 ? 'clave' : 'claves'} en uso
            {variantCount > 0 ? ` · ${variantCount} variantes` : ''}
          </span>
        </div>
        {keys.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
            <Tags className="h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              Todavía no hay atributos. Agregalos en las variantes desde el editor de producto.
            </p>
            <Link href="/admin/productos" className="text-sm text-primary hover:underline">
              Ir a Productos
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {keys.map(({ key, count }) => (
              <li key={key} className="flex items-center justify-between gap-3 px-5 py-3">
                <span className="font-mono text-sm text-foreground">{key}</span>
                <span className="rounded-full border border-border bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                  {count} {count === 1 ? 'variante' : 'variantes'}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}