'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowUp, ArrowDown, Star, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button, Badge } from '@tienda/ui';
import type { FeaturedAdminRow } from '@lib/products/featured';

type FeaturedManagerProps = {
  initialRows: FeaturedAdminRow[];
};

export function FeaturedManager({ initialRows }: FeaturedManagerProps) {
  const [rows, setRows] = useState<FeaturedAdminRow[]>(initialRows);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function reorder(next: FeaturedAdminRow[]) {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const response = await fetch('/api/admin/products/featured', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderedIds: next.map((row) => row.productId) }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        setError(data?.error ?? 'No se pudo reordenar');
        return;
      }
      setRows(next);
      setNotice('Orden actualizado');
    } catch {
      setError('Error de conexión');
    } finally {
      setBusy(false);
    }
  }

  async function remove(productId: string, name: string) {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const response = await fetch(`/api/admin/products/${productId}/featured`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ featured: false }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        setError(data?.error ?? 'No se pudo desmarcar');
        return;
      }
      setRows((prev) => prev.filter((row) => row.productId !== productId));
      setNotice(`"${name}" desmarcado de destacados`);
    } catch {
      setError('Error de conexión');
    } finally {
      setBusy(false);
    }
  }

  async function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= rows.length) return;
    const next = rows.slice();
    const [item] = next.splice(index, 1);
    next.splice(target, 0, item!);
    await reorder(next);
  }

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="border-b border-border px-5 py-3">
        <h2 className="text-sm font-medium text-foreground">Productos destacados</h2>
        <p className="text-xs text-muted-foreground">
          Orden de aparición en Home y /catalogo/destacados. Solo productos publicables se muestran al público.
        </p>
      </div>

      <div className="p-5">
        {error ? (
          <div
            role="alert"
            className="mb-4 flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            <AlertCircle className="h-4 w-4 shrink-0" /> {error}
          </div>
        ) : null}
        {notice ? (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-emerald-600/30 bg-emerald-600/10 px-3 py-2 text-sm text-emerald-700">
            <CheckCircle2 className="h-4 w-4 shrink-0" /> {notice}
          </div>
        ) : null}

        {rows.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No hay productos destacados. Marcá productos desde su ficha en /admin/productos.
          </p>
        ) : (
          <ul className="space-y-2">
            {rows.map((row, index) => (
              <li
                key={row.productId}
                className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background px-3 py-2.5"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 shrink-0 text-primary" />
                    <Link
                      href={`/admin/productos/${row.productId}`}
                      className="truncate text-sm font-medium text-foreground hover:text-primary"
                    >
                      {row.name}
                    </Link>
                  </div>
                  <p className="truncate text-xs text-muted-foreground">
                    {row.slug} · <Badge variant="secondary" size="sm">{row.status}</Badge>
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label="Mover arriba"
                    disabled={index === 0 || busy}
                    onClick={() => move(index, -1)}
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label="Mover abajo"
                    disabled={index === rows.length - 1 || busy}
                    onClick={() => move(index, 1)}
                  >
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    aria-label={`Desmarcar ${row.name}`}
                    disabled={busy}
                    onClick={() => remove(row.productId, row.name)}
                  >
                    Quitar
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}