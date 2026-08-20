'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowUp, ArrowDown, Trash2, Plus, Search, AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '@lib/helpers/cn';
import { Button, Input, Badge } from '@tienda/ui';
import {
  RELATION_TYPES,
  type ProductRelationTypeValue,
  type RelationTarget,
  type RelationCard,
} from '@lib/products/relations';

type Group = { type: ProductRelationTypeValue; items: RelationTarget[] };

type RelationsManagerProps = {
  productId: string;
  productName: string;
  initialGroups: Group[];
};

const TYPE_ORDER: ProductRelationTypeValue[] = ['RELATED', 'ALTERNATIVE', 'COMPLEMENTARY'];

export function RelationsManager({ productId, productName, initialGroups }: RelationsManagerProps) {
  const [groups, setGroups] = useState<Group[]>(initialGroups);
  const [activeType, setActiveType] = useState<ProductRelationTypeValue>(TYPE_ORDER[0]!);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<RelationCard[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const activeItems = useMemo(
    () => groups.find((g) => g.type === activeType)?.items ?? [],
    [groups, activeType],
  );

  const runSearch = useCallback(
    async (q: string) => {
      if (!q.trim()) {
        setResults([]);
        setSearchError(null);
        return;
      }
      setSearching(true);
      setSearchError(null);
      try {
        const response = await fetch(
          `/api/admin/products/search?q=${encodeURIComponent(q.trim())}&exclude=${encodeURIComponent(productId)}`,
        );
        const data = await response.json();
        if (!response.ok) {
          setSearchError(data.error ?? 'No se pudo buscar');
          setResults([]);
          return;
        }
        setResults(data.items ?? []);
      } catch {
        setSearchError('Error de conexión');
        setResults([]);
      } finally {
        setSearching(false);
      }
    },
    [productId],
  );

  useEffect(() => {
    const handle = setTimeout(() => {
      void runSearch(query);
    }, 300);
    return () => clearTimeout(handle);
  }, [query, runSearch]);

  async function addRelation(targetProductId: string, name: string) {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const response = await fetch(`/api/admin/products/${productId}/relations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetProductId, type: activeType }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? 'No se pudo agregar la relación');
        return;
      }
      setGroups((prev) =>
        prev.map((group) =>
          group.type === activeType
            ? { ...group, items: [...group.items, data.item as RelationTarget] }
            : group,
        ),
      );
      setQuery('');
      setResults([]);
      setNotice(`"${name}" agregado como ${RELATION_TYPES[activeType].label.toLowerCase()}`);
    } catch {
      setError('Error de conexión');
    } finally {
      setBusy(false);
    }
  }

  async function removeRelation(relationId: string, name: string) {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const response = await fetch(
        `/api/admin/products/${productId}/relations?relationId=${encodeURIComponent(relationId)}`,
        { method: 'DELETE' },
      );
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        setError(data?.error ?? 'No se pudo eliminar la relación');
        return;
      }
      setGroups((prev) =>
        prev.map((group) =>
          group.type === activeType
            ? { ...group, items: group.items.filter((item) => item.relationId !== relationId) }
            : group,
        ),
      );
      setNotice(`"${name}" eliminado`);
    } catch {
      setError('Error de conexión');
    } finally {
      setBusy(false);
    }
  }

  async function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= activeItems.length) return;

    const reordered = activeItems.slice();
    const [item] = reordered.splice(index, 1);
    reordered.splice(target, 0, item!);

    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const response = await fetch(`/api/admin/products/${productId}/relations`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: activeType, orderedIds: reordered.map((r) => r.relationId) }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        setError(data?.error ?? 'No se pudo reordenar');
        return;
      }
      setGroups((prev) =>
        prev.map((group) => (group.type === activeType ? { ...group, items: reordered } : group)),
      );
    } catch {
      setError('Error de conexión');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        {TYPE_ORDER.map((type) => {
          const count = groups.find((g) => g.type === type)?.items.length ?? 0;
          return (
            <button
              key={type}
              type="button"
              onClick={() => setActiveType(type)}
              className={cn(
                'inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors',
                activeType === type
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-card text-muted-foreground hover:text-foreground',
              )}
            >
              {RELATION_TYPES[type].label}
              <Badge variant="secondary" size="sm">{count}</Badge>
            </button>
          );
        })}
      </div>

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

      <div className="rounded-xl border border-border bg-card">
        <div className="border-b border-border px-5 py-3">
          <h2 className="text-sm font-medium text-foreground">
            {RELATION_TYPES[activeType].label}
          </h2>
          <p className="text-xs text-muted-foreground">{RELATION_TYPES[activeType].description}</p>
        </div>

        <div className="p-5">
          {activeItems.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Sin {RELATION_TYPES[activeType].label.toLowerCase()} todavía. Buscá productos para agregar.
            </p>
          ) : (
            <ul className="space-y-2">
              {activeItems.map((item, index) => (
                <li
                  key={item.relationId}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background px-3 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{item.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{item.slug}</p>
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
                      disabled={index === activeItems.length - 1 || busy}
                      onClick={() => move(index, 1)}
                    >
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      aria-label={`Eliminar ${item.name}`}
                      disabled={busy}
                      onClick={() => removeRelation(item.relationId, item.name)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-5 border-t border-border pt-5">
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder={`Buscar productos para agregar como ${RELATION_TYPES[activeType].label.toLowerCase()}…`}
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
              </div>
            </div>

            {searching ? (
              <p className="mt-2 text-xs text-muted-foreground">Buscando…</p>
            ) : null}
            {searchError ? <p className="mt-2 text-xs text-destructive">{searchError}</p> : null}

            {results.length > 0 ? (
              <ul className="mt-2 max-h-64 space-y-1 overflow-y-auto rounded-lg border border-border">
                {results.map((result) => (
                  <li key={result.id}>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => addRelation(result.id, result.name)}
                      className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-accent disabled:opacity-50"
                    >
                      <span className="min-w-0">
                        <span className="block truncate font-medium text-foreground">{result.name}</span>
                        <span className="block truncate text-xs text-muted-foreground">{result.slug}</span>
                      </span>
                      <Plus className="h-4 w-4 shrink-0 text-primary" />
                    </button>
                  </li>
                ))}
              </ul>
            ) : query.trim() && !searching && !searchError ? (
              <p className="mt-2 text-xs text-muted-foreground">
                Sin resultados para {productName}.
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}