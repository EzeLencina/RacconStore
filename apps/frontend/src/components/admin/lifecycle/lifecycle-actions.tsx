'use client';

import { useCallback, useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, Rocket, Pause, Archive, RotateCcw, CalendarClock, XCircle } from 'lucide-react';
import { Button, Badge } from '@tienda/ui';
import {
  STATUS_LABELS,
  getAllowedTransitions,
  getPublishReadiness,
  getEffectiveStatus,
  validateSchedule,
  type ProductStatusValue,
  type PublishReadiness,
} from '@lib/products/lifecycle.types';

export type LifecycleActionsProps = {
  productId: string;
  initialStatus: ProductStatusValue;
  initialVersion: number;
  initialTransitions: ProductStatusValue[];
  initialReadiness: PublishReadiness;
  initialEffectiveStatus: ProductStatusValue;
  initialPublishAt: string | null;
  initialUnpublishAt: string | null;
};

const ACTION_META: Record<ProductStatusValue, { label: string; icon: typeof Rocket } | null> = {
  ACTIVE: { label: 'Publicar ahora', icon: Rocket },
  INACTIVE: { label: 'Desactivar', icon: Pause },
  ARCHIVED: { label: 'Archivar', icon: Archive },
  DRAFT: { label: 'Restaurar', icon: RotateCcw },
};

function toLocalInputValue(iso: string | null): string {
  if (!iso) return '';
  const date = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('es-AR');
}

export function LifecycleActions({
  productId,
  initialStatus,
  initialVersion,
  initialTransitions,
  initialReadiness,
  initialEffectiveStatus,
  initialPublishAt,
  initialUnpublishAt,
}: LifecycleActionsProps) {
  const [status, setStatus] = useState<ProductStatusValue>(initialStatus);
  const [version, setVersion] = useState(initialVersion);
  const [transitions, setTransitions] = useState<ProductStatusValue[]>(initialTransitions);
  const [readiness, setReadiness] = useState<PublishReadiness>(initialReadiness);
  const [effectiveStatus, setEffectiveStatus] = useState<ProductStatusValue>(initialEffectiveStatus);
  const [publishAt, setPublishAt] = useState<string | null>(initialPublishAt);
  const [unpublishAt, setUnpublishAt] = useState<string | null>(initialUnpublishAt);
  const [hasSchedule, setHasSchedule] = useState(
    Boolean(initialPublishAt || initialUnpublishAt),
  );
  const [draftPublish, setDraftPublish] = useState(toLocalInputValue(initialPublishAt));
  const [draftUnpublish, setDraftUnpublish] = useState(toLocalInputValue(initialUnpublishAt));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [blockers, setBlockers] = useState<PublishReadiness['blockers']>([]);
  const [notice, setNotice] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const response = await fetch(`/api/admin/products/${productId}/status`);
      if (!response.ok) return;
      const data = await response.json();
      setStatus(data.status as ProductStatusValue);
      setVersion(data.version);
      setTransitions(getAllowedTransitions(data.status));
      setReadiness(getPublishReadiness(data));
      setEffectiveStatus(getEffectiveStatus(data));
      setPublishAt(data.publishAt ?? null);
      setUnpublishAt(data.unpublishAt ?? null);
      setHasSchedule(Boolean(data.publishAt || data.unpublishAt));
    } catch {
      // keep current state
    }
  }, [productId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function apply(target: ProductStatusValue) {
    setBusy(true);
    setError(null);
    setBlockers([]);
    setNotice(null);
    try {
      const response = await fetch(`/api/admin/products/${productId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: target }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setError(data?.error ?? 'No se pudo cambiar el estado');
        if (Array.isArray(data?.blockers)) {
          setBlockers(data.blockers);
        }
        return;
      }
      await refresh();
      setNotice(`Estado actualizado a ${STATUS_LABELS[target]}`);
    } catch {
      setError('Error de conexión');
    } finally {
      setBusy(false);
    }
  }

  async function saveSchedule() {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const publishValue = draftPublish ? new Date(draftPublish).toISOString() : null;
      const unpublishValue = draftUnpublish ? new Date(draftUnpublish).toISOString() : null;
      const validation = validateSchedule(publishValue, unpublishValue);
      if (!validation.valid) {
        setError(validation.error ?? 'Programación inválida');
        return;
      }
      const response = await fetch(`/api/admin/products/${productId}/schedule`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publishAt: publishValue, unpublishAt: unpublishValue }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setError(data?.error ?? 'No se pudo programar');
        return;
      }
      await refresh();
      setNotice('Publicación programada. El catálogo respetará la ventana efectiva.');
    } catch {
      setError('Error de conexión');
    } finally {
      setBusy(false);
    }
  }

  async function cancelSchedule() {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const response = await fetch(`/api/admin/products/${productId}/schedule`, {
        method: 'DELETE',
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setError(data?.error ?? 'No se pudo cancelar la programación');
        return;
      }
      await refresh();
      setDraftPublish('');
      setDraftUnpublish('');
      setNotice('Programación cancelada.');
    } catch {
      setError('Error de conexión');
    } finally {
      setBusy(false);
    }
  }

  const scheduled = Boolean(publishAt || unpublishAt);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="secondary" size="sm">
          {STATUS_LABELS[status]}
        </Badge>
        {effectiveStatus !== status ? (
          <Badge size="sm">efectivo: {STATUS_LABELS[effectiveStatus]}</Badge>
        ) : null}
        <span className="text-xs text-muted-foreground">versión {version}</span>
      </div>

      {scheduled ? (
        <div className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-sm text-foreground">
          <CalendarClock className="h-4 w-4 shrink-0" />
          <span>
            Programado
            {publishAt ? ` desde ${formatDate(publishAt)}` : ''}
            {unpublishAt ? ` hasta ${formatDate(unpublishAt)}` : ''} (UTC)
          </span>
        </div>
      ) : null}

      {error ? (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          <AlertCircle className="h-4 w-4 shrink-0" /> {error}
        </div>
      ) : null}

      {status !== 'ACTIVE' && status !== 'ARCHIVED' && !readiness.canPublish ? (
        <div className="rounded-lg border border-amber-600/30 bg-amber-600/10 px-3 py-2">
          <p className="text-sm font-medium text-amber-700">El producto no está listo para publicarse</p>
          <ul className="mt-1 space-y-0.5 text-xs text-amber-700">
            {[...readiness.blockers, ...blockers]
              .filter((b, index, all) => all.findIndex((x) => x.code === b.code) === index)
              .map((blocker) => (
                <li key={blocker.code}>• {blocker.message}</li>
              ))}
          </ul>
        </div>
      ) : null}

      {notice ? (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-600/30 bg-emerald-600/10 px-3 py-2 text-sm text-emerald-700">
          <CheckCircle2 className="h-4 w-4 shrink-0" /> {notice}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {transitions.map((target) => {
          const meta = ACTION_META[target];
          if (!meta) return null;
          const blocked = target === 'ACTIVE' && !readiness.canPublish;
          const Icon = meta.icon;
          return (
            <Button
              key={target}
              variant={target === 'ACTIVE' ? 'primary' : 'outline'}
              size="sm"
              disabled={busy || blocked}
              onClick={() => apply(target)}
            >
              <Icon className="h-4 w-4" />
              {meta.label}
            </Button>
          );
        })}
      </div>

      <div className="border-t border-border pt-4">
        <p className="text-sm font-medium text-foreground">Publicación programada</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="block text-xs text-muted-foreground">
            Publicar (local)
            <input
              type="datetime-local"
              value={draftPublish}
              onChange={(event) => setDraftPublish(event.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
            />
          </label>
          <label className="block text-xs text-muted-foreground">
            Despublicar (local)
            <input
              type="datetime-local"
              value={draftUnpublish}
              onChange={(event) => setDraftUnpublish(event.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
            />
          </label>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" disabled={busy} onClick={() => saveSchedule()}>
            <CalendarClock className="h-4 w-4" />
            Programar
          </Button>
          {scheduled ? (
            <Button variant="ghost" size="sm" disabled={busy} onClick={() => cancelSchedule()}>
              <XCircle className="h-4 w-4" />
              Cancelar programación
            </Button>
          ) : null}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          La ventana se guarda en UTC y el catálogo público calcula el estado efectivo al leer.
        </p>
      </div>
    </div>
  );
}