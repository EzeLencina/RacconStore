'use client';

import { useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, FileUp, RefreshCw, Upload } from 'lucide-react';
import { Button, Badge } from '@tienda/ui';
import type {
  ImportConfirmResult,
  ImportMode,
  ImportPreviewResult,
} from '@lib/products/import-export.types';

export function ImportManager() {
  const [mode, setMode] = useState<ImportMode>('UPSERT');
  const [fileName, setFileName] = useState<string | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<ImportPreviewResult | null>(null);
  const [result, setResult] = useState<ImportConfirmResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function runPreview(file: File) {
    setPreviewing(true);
    setError(null);
    setResult(null);
    setPreview(null);
    try {
      const body = new FormData();
      body.append('file', file);
      body.append('mode', mode);
      const response = await fetch('/api/admin/products/import/preview', { method: 'POST', body });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setError(data?.error ?? 'No se pudo previsualizar el archivo');
        return;
      }
      setPreview(data as ImportPreviewResult);
    } catch {
      setError('Error de conexión');
    } finally {
      setPreviewing(false);
    }
  }

  async function confirm() {
    if (!preview) return;
    setConfirming(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/products/import/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ importId: preview.importId }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setError(data?.error ?? 'No se pudo aplicar la importación');
        return;
      }
      setResult(data as ImportConfirmResult);
    } catch {
      setError('Error de conexión');
    } finally {
      setConfirming(false);
    }
  }

  const hasErrors = preview && preview.errors.length > 0;

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center gap-2">
          <FileUp className="h-5 w-5 text-primary" />
          <h2 className="text-sm font-medium text-foreground">Importar productos</h2>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Subí un archivo CSV con las columnas de exportación. Se valida antes de modificar datos.
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <input
            ref={inputRef}
            type="file"
            accept=".csv,text/csv"
            className="block w-full max-w-sm text-sm text-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-muted file:px-3 file:py-2 file:text-sm file:font-medium file:text-foreground"
            onChange={(event) => {
              const file = event.target.files?.[0] ?? null;
              setFileName(file ? file.name : null);
              setPreview(null);
              setResult(null);
              setError(null);
              if (file) void runPreview(file);
            }}
          />

          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            Modo
            <select
              value={mode}
              onChange={(event) => setMode(event.target.value as ImportMode)}
              className="rounded-lg border border-border bg-background px-2 py-1.5 text-sm text-foreground"
            >
              <option value="UPSERT">Crear o actualizar</option>
              <option value="CREATE">Solo crear</option>
              <option value="UPDATE">Solo actualizar</option>
            </select>
          </label>
        </div>

        {error ? (
          <div
            role="alert"
            className="mt-4 flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            <AlertCircle className="h-4 w-4 shrink-0" /> {error}
          </div>
        ) : null}

        {previewing ? (
          <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
            <RefreshCw className="h-4 w-4 animate-spin" /> Previsualizando…
          </p>
        ) : null}

        {fileName && !preview && !previewing && !error ? (
          <p className="mt-4 text-sm text-muted-foreground">
            <Badge variant="secondary" size="sm">{fileName}</Badge> — elegí el modo y volvé a subir para previsualizar.
          </p>
        ) : null}
      </div>

      {preview ? (
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-sm font-medium text-foreground">Previsualización (dry-run)</h2>
            <Badge size="sm">{fileName}</Badge>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <div className="rounded-lg border border-border bg-muted/40 p-3 text-center">
              <p className="text-2xl font-bold text-foreground">{preview.total}</p>
              <p className="text-xs text-muted-foreground">filas</p>
            </div>
            <div className="rounded-lg border border-border bg-muted/40 p-3 text-center">
              <p className="text-2xl font-bold text-foreground">{preview.valid}</p>
              <p className="text-xs text-muted-foreground">válidas</p>
            </div>
            <div className="rounded-lg border border-border bg-muted/40 p-3 text-center">
              <p className="text-2xl font-bold text-emerald-600">{preview.toCreate}</p>
              <p className="text-xs text-muted-foreground">crear</p>
            </div>
            <div className="rounded-lg border border-border bg-muted/40 p-3 text-center">
              <p className="text-2xl font-bold text-primary">{preview.toUpdate}</p>
              <p className="text-xs text-muted-foreground">actualizar</p>
            </div>
            <div className="rounded-lg border border-border bg-muted/40 p-3 text-center">
              <p className="text-2xl font-bold text-muted-foreground">{preview.noop}</p>
              <p className="text-xs text-muted-foreground">sin cambios</p>
            </div>
          </div>

          {preview.invalid > 0 ? (
            <div className="mt-4">
              <p className="text-sm font-medium text-destructive">{preview.invalid} filas con errores</p>
              <div className="mt-2 max-h-64 overflow-auto rounded-lg border border-border">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border bg-muted/40 text-left text-muted-foreground">
                      <th className="px-3 py-2 font-medium">Fila</th>
                      <th className="px-3 py-2 font-medium">SKU</th>
                      <th className="px-3 py-2 font-medium">Slug</th>
                      <th className="px-3 py-2 font-medium">Errores</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.errors.map((entry) => (
                      <tr key={entry.row} className="border-b border-border last:border-0">
                        <td className="px-3 py-2 text-muted-foreground">{entry.row}</td>
                        <td className="px-3 py-2 font-medium text-foreground">{entry.sku}</td>
                        <td className="px-3 py-2 text-muted-foreground">{entry.slug || '—'}</td>
                        <td className="px-3 py-2 text-destructive">{entry.errors.join('; ')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <Button variant="primary" size="sm" disabled={confirming || preview.valid === 0} onClick={() => confirm()}>
              <Upload className="h-4 w-4" />
              {confirming ? 'Aplicando…' : 'Confirmar importación'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={confirming}
              onClick={() => {
                setPreview(null);
                setResult(null);
                setFileName(null);
                setError(null);
                if (inputRef.current) inputRef.current.value = '';
              }}
            >
              Cancelar
            </Button>
            {hasErrors ? (
              <span className="text-xs text-muted-foreground">
                Las filas con errores se omitirán. {preview.valid} filas válidas se aplicarán.
              </span>
            ) : null}
          </div>
        </div>
      ) : null}

      {result ? (
        <div
          role="status"
          className="rounded-xl border border-emerald-600/30 bg-emerald-600/10 p-5"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            <h2 className="text-sm font-medium text-emerald-700">Importación aplicada</h2>
          </div>
          <div className="mt-3 flex flex-wrap gap-4 text-sm text-emerald-700">
            <span>{result.created} creados</span>
            <span>{result.updated} actualizados</span>
            <span>{result.noop} sin cambios</span>
            <span>{result.errors.length} errores</span>
          </div>
          {result.errors.length > 0 ? (
            <div className="mt-3 max-h-40 overflow-auto rounded-lg border border-emerald-600/20">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-emerald-600/20 text-left text-emerald-700">
                    <th className="px-3 py-1.5 font-medium">Fila</th>
                    <th className="px-3 py-1.5 font-medium">SKU</th>
                    <th className="px-3 py-1.5 font-medium">Error</th>
                  </tr>
                </thead>
                <tbody>
                  {result.errors.map((entry) => (
                    <tr key={entry.row} className="border-b border-emerald-600/10 last:border-0">
                      <td className="px-3 py-1.5">{entry.row}</td>
                      <td className="px-3 py-1.5 font-medium">{entry.sku}</td>
                      <td className="px-3 py-1.5">{entry.errors.join('; ')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}