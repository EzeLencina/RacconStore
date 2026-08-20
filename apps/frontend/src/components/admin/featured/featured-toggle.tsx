'use client';

import { useState } from 'react';
import { Star, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@tienda/ui';

type FeaturedToggleProps = {
  productId: string;
  initiallyFeatured: boolean;
};

export function FeaturedToggle({ productId, initiallyFeatured }: FeaturedToggleProps) {
  const [featured, setFeatured] = useState(initiallyFeatured);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function toggle() {
    const next = !featured;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const response = await fetch(`/api/admin/products/${productId}/featured`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ featured: next }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        setError(data?.error ?? 'No se pudo actualizar el estado destacado');
        return;
      }
      setFeatured(next);
      setNotice(next ? 'Marcado como destacado' : 'Desmarcado de destacados');
    } catch {
      setError('Error de conexión');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      {error ? (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          <AlertCircle className="h-4 w-4 shrink-0" /> {error}
        </div>
      ) : null}
      {notice ? (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-600/30 bg-emerald-600/10 px-3 py-2 text-sm text-emerald-700">
          <CheckCircle2 className="h-4 w-4 shrink-0" /> {notice}
        </div>
      ) : null}
      <Button
        variant={featured ? 'outline' : 'primary'}
        onClick={toggle}
        disabled={busy}
      >
        <Star className="h-4 w-4" />
        {featured ? 'Desmarcar de destacados' : 'Marcar como destacado'}
      </Button>
    </div>
  );
}