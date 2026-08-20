'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, Loader2, Pencil, Plus, SearchX, Trash2, X } from 'lucide-react';
import { Button, Input, Select, Textarea, Badge } from '@tienda/ui';

type FieldType = 'text' | 'textarea' | 'select' | 'number' | 'date' | 'parent';

export type CatalogField = {
  key: string;
  label: string;
  type: FieldType;
  options?: readonly string[];
};

type CatalogRow = Record<string, unknown> & { id: string };

type CatalogManagerProps = {
  title: string;
  description: string;
  endpoint: string;
  statusOptions: readonly string[];
  fields: CatalogField[];
  emptyMessage: string;
  showTypeFilter?: boolean;
  typeOptions?: readonly string[];
  typeFilterLabel?: string;
};

type ListResponse = { items: CatalogRow[]; total: number; page: number; pageSize: number };

function toFormValue(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (value instanceof Date) return value.toISOString();
  return String(value);
}

function fromFormValue(field: CatalogField, raw: string): unknown {
  if (field.type === 'date') return raw === '' ? null : raw;
  return raw;
}

export function CatalogManager({
  title,
  description,
  endpoint,
  statusOptions,
  fields,
  emptyMessage,
  showTypeFilter,
  typeOptions,
  typeFilterLabel,
}: CatalogManagerProps) {
  const [rows, setRows] = useState<CatalogRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});

  const pageSize = 20;

  async function load() {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    if (q) params.set('q', q);
    if (statusFilter) params.set('status', statusFilter);
    if (typeFilter) params.set('type', typeFilter);
    try {
      const response = await fetch(`${endpoint}?${params.toString()}`);
      const data = (await response.json()) as ListResponse;
      if (!response.ok) {
        setError((data as { error?: string }).error ?? 'Error al cargar');
        return;
      }
      setRows(data.items);
      setTotal(data.total);
    } catch {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, statusFilter, typeFilter, endpoint]);

  function resetForm() {
    const empty: Record<string, string> = {};
    for (const field of fields) empty[field.key] = '';
    setForm(empty);
  }

  function startCreate() {
    resetForm();
    setEditingId(null);
    setShowForm(true);
  }

  function startEdit(row: CatalogRow) {
    const values: Record<string, string> = {};
    for (const field of fields) {
      values[field.key] = toFormValue(row[field.key]);
      if (field.type === 'date' && values[field.key]) {
        values[field.key] = values[field.key]!.slice(0, 10);
      }
    }
    values['__version'] = String(row['version'] ?? 1);
    setForm(values);
    setEditingId(row.id);
    setShowForm(true);
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = form['name']?.trim();
    if (!name) {
      setError('El nombre es obligatorio');
      return;
    }
    setBusy(true);
    setError(null);
    setNotice(null);
    const input: Record<string, unknown> = {};
    for (const field of fields) {
      const raw = form[field.key] ?? '';
      if (field.type === 'parent' && raw === '') {
        input[field.key] = null;
      } else {
        input[field.key] = fromFormValue(field, raw);
      }
    }
    input['name'] = name;

    try {
      const response = await fetch(editingId ? `${endpoint}/${editingId}` : endpoint, {
        method: editingId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          editingId ? { input, expectedVersion: Number(form['__version']) } : input,
        ),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setError(data?.error ?? 'No se pudo guardar');
        return;
      }
      setShowForm(false);
      setEditingId(null);
      setNotice(editingId ? 'Guardado' : 'Creado');
      await load();
    } catch {
      setError('Error de conexión');
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string, name: string) {
    if (!window.confirm(`¿Eliminar "${name}"?`)) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const response = await fetch(`${endpoint}/${id}`, { method: 'DELETE' });
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        setError(data?.error ?? 'No se pudo eliminar');
        return;
      }
      setNotice('Eliminado');
      await load();
    } catch {
      setError('Error de conexión');
    } finally {
      setBusy(false);
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const hasFilters = Boolean(q || statusFilter || typeFilter);
  const parentOptions =
    fields.some((f) => f.type === 'parent')
      ? rows.filter((row) => row['id'] !== editingId).map((row) => ({ id: row['id'], name: String(row['name'] ?? '') }))
      : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
        <Button size="sm" onClick={startCreate}>
          <Plus className="h-4 w-4" /> Nuevo
        </Button>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card px-5 py-4 lg:flex-row lg:items-end">
        <label className="flex-1 space-y-1.5">
          <span className="text-xs font-medium text-muted-foreground">Buscar</span>
          <Input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                setPage(1);
                void load();
              }
            }}
            placeholder="Nombre o slug…"
          />
        </label>
        <label className="space-y-1.5">
          <span className="text-xs font-medium text-muted-foreground">Estado</span>
          <Select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
            <option value="">Todos</option>
            {statusOptions.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </Select>
        </label>
        {showTypeFilter && typeOptions ? (
          <label className="space-y-1.5">
            <span className="text-xs font-medium text-muted-foreground">{typeFilterLabel ?? 'Tipo'}</span>
            <Select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}>
              <option value="">Todos</option>
              {typeOptions.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </Select>
          </label>
        ) : null}
        <Button size="sm" onClick={() => { setPage(1); void load(); }}>Buscar</Button>
        {hasFilters ? (
          <Button
            size="sm"
            variant="outline"
            onClick={() => { setQ(''); setStatusFilter(''); setTypeFilter(''); setPage(1); }}
          >
            Limpiar
          </Button>
        ) : null}
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

      {showForm ? (
        <form onSubmit={submit} className="rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-5 py-3">
            <h2 className="text-sm font-medium text-foreground">
              {editingId ? 'Editar' : 'Nuevo'}
            </h2>
            <button
              type="button"
              onClick={() => { setShowForm(false); setEditingId(null); }}
              className="rounded-lg p-1 text-muted-foreground hover:bg-accent"
              aria-label="Cerrar formulario"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="grid gap-4 px-5 py-4 md:grid-cols-2">
            {fields.map((field) => (
              <label
                key={field.key}
                className={`space-y-1.5 ${field.type === 'textarea' ? 'md:col-span-2' : ''}`}
              >
                <span className="text-xs font-medium text-muted-foreground">
                  {field.label} {field.key === 'name' ? '*' : ''}
                </span>
                {field.type === 'textarea' ? (
                  <Textarea
                    value={form[field.key] ?? ''}
                    onChange={(e) => setForm((p) => ({ ...p, [field.key]: e.target.value }))}
                    rows={3}
                  />
                ) : field.type === 'select' || field.type === 'parent' ? (
                  <Select
                    value={form[field.key] ?? ''}
                    onChange={(e) => setForm((p) => ({ ...p, [field.key]: e.target.value }))}
                  >
                    <option value="">
                      {field.type === 'parent' ? 'Sin categoría padre' : 'Sin seleccionar'}
                    </option>
                    {field.type === 'parent'
                      ? parentOptions.map((p) => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))
                      : (field.options ?? []).map((o) => (
                          <option key={o} value={o}>{o}</option>
                        ))}
                  </Select>
                ) : (
                  <Input
                    type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
                    min={field.type === 'number' ? 0 : undefined}
                    value={form[field.key] ?? ''}
                    onChange={(e) => setForm((p) => ({ ...p, [field.key]: e.target.value }))}
                  />
                )}
              </label>
            ))}
          </div>
          <div className="flex justify-end gap-2 border-t border-border px-5 py-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => { setShowForm(false); setEditingId(null); }}
            >
              Cancelar
            </Button>
            <Button type="submit" size="sm" disabled={busy}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {editingId ? 'Guardar' : 'Crear'}
            </Button>
          </div>
        </form>
      ) : null}

      <div className="rounded-xl border border-border bg-card">
        <div className="border-b border-border px-5 py-3">
          <span className="text-sm font-medium text-foreground">
            {total} {total === 1 ? 'registro' : 'registros'}
          </span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 px-6 py-16 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Cargando…
          </div>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
            <SearchX className="h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">{emptyMessage}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="px-5 py-3 font-medium">Nombre</th>
                  <th className="hidden px-5 py-3 font-medium md:table-cell">Slug</th>
                  {showTypeFilter ? (
                    <th className="hidden px-5 py-3 font-medium md:table-cell">Tipo</th>
                  ) : null}
                  <th className="px-5 py-3 font-medium">Estado</th>
                  <th className="px-5 py-3 font-medium text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row['id']} className="border-b border-border last:border-0">
                    <td className="px-5 py-3 font-medium text-foreground">{String(row['name'] ?? '')}</td>
                    <td className="hidden px-5 py-3 text-muted-foreground md:table-cell">{String(row['slug'] ?? '')}</td>
                    {showTypeFilter ? (
                      <td className="hidden px-5 py-3 text-muted-foreground md:table-cell">
                        {String(row['type'] ?? '')}
                      </td>
                    ) : null}
                    <td className="px-5 py-3">
                      <Badge variant="secondary" size="sm">{String(row['status'] ?? '')}</Badge>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => startEdit(row)} aria-label="Editar">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => void remove(row['id'], String(row['name'] ?? ''))}
                          aria-label="Eliminar"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {totalPages > 1 ? (
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            Página {page} de {totalPages}
          </span>
          <div className="flex gap-2">
            {page > 1 ? (
              <Button variant="outline" size="sm" onClick={() => setPage((p) => p - 1)}>Anterior</Button>
            ) : null}
            {page < totalPages ? (
              <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)}>Siguiente</Button>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}