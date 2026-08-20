'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { Button, Input, Select, Textarea } from '@tienda/ui';
import {
  PRODUCT_TYPES,
  PRODUCT_STATUSES,
  PRODUCT_VISIBILITIES,
  PRODUCT_CONDITIONS,
} from '@lib/products/crud';

export type ProductFormBrand = { id: string; name: string };

type ProductFormProps = {
  brands: ProductFormBrand[];
};

export function ProductForm({ brands }: ProductFormProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [description, setDescription] = useState('');
  const [productType, setProductType] = useState<string>('PHYSICAL');
  const [status, setStatus] = useState<string>('DRAFT');
  const [visibility, setVisibility] = useState<string>('PUBLIC');
  const [condition, setCondition] = useState<string>('NEW');
  const [warrantyMonths, setWarrantyMonths] = useState('');
  const [brandId, setBrandId] = useState('');
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setNotice(null);

    if (!name.trim()) {
      setError('El nombre es obligatorio');
      setBusy(false);
      return;
    }

    try {
      const response = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          slug: slug.trim() || undefined,
          shortDescription: shortDescription.trim() || null,
          description: description.trim() || null,
          productType,
          status,
          visibility,
          condition,
          warrantyMonths: warrantyMonths === '' ? null : Number(warrantyMonths),
          brandId: brandId || null,
          seoTitle: seoTitle.trim() || null,
          seoDescription: seoDescription.trim() || null,
        }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setError(data?.error ?? 'No se pudo crear el producto');
        return;
      }
      setNotice('Producto creado');
      router.push(`/admin/productos/${data.id}/editar`);
      router.refresh();
    } catch {
      setError('Error de conexión');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
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
          <h2 className="text-sm font-medium text-foreground">Datos generales</h2>
        </div>
        <div className="grid gap-4 px-5 py-4 md:grid-cols-2">
          <label className="space-y-1.5 md:col-span-2">
            <span className="text-xs font-medium text-muted-foreground">Nombre *</span>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Auriculares Pro"
              required
            />
          </label>
          <label className="space-y-1.5 md:col-span-2">
            <span className="text-xs font-medium text-muted-foreground">Slug (opcional, se autogenera)</span>
            <Input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="ej: auriculares-pro"
            />
          </label>
          <label className="space-y-1.5 md:col-span-2">
            <span className="text-xs font-medium text-muted-foreground">Descripción corta</span>
            <Input
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              placeholder="Una línea para listados"
            />
          </label>
          <label className="space-y-1.5 md:col-span-2">
            <span className="text-xs font-medium text-muted-foreground">Descripción</span>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descripción completa del producto"
              rows={5}
            />
          </label>
          <label className="space-y-1.5">
            <span className="text-xs font-medium text-muted-foreground">Tipo</span>
            <Select value={productType} onChange={(e) => setProductType(e.target.value)}>
              {PRODUCT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
          </label>
          <label className="space-y-1.5">
            <span className="text-xs font-medium text-muted-foreground">Estado</span>
            <Select value={status} onChange={(e) => setStatus(e.target.value)}>
              {PRODUCT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </label>
          <label className="space-y-1.5">
            <span className="text-xs font-medium text-muted-foreground">Visibilidad</span>
            <Select value={visibility} onChange={(e) => setVisibility(e.target.value)}>
              {PRODUCT_VISIBILITIES.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </Select>
          </label>
          <label className="space-y-1.5">
            <span className="text-xs font-medium text-muted-foreground">Condición</span>
            <Select value={condition} onChange={(e) => setCondition(e.target.value)}>
              {PRODUCT_CONDITIONS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </label>
          <label className="space-y-1.5">
            <span className="text-xs font-medium text-muted-foreground">Garantía (meses)</span>
            <Input
              type="number"
              min={0}
              value={warrantyMonths}
              onChange={(e) => setWarrantyMonths(e.target.value)}
              placeholder="0"
            />
          </label>
          <label className="space-y-1.5">
            <span className="text-xs font-medium text-muted-foreground">Marca</span>
            <Select value={brandId} onChange={(e) => setBrandId(e.target.value)}>
              <option value="">Sin marca</option>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </Select>
          </label>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card">
        <div className="border-b border-border px-5 py-3">
          <h2 className="text-sm font-medium text-foreground">SEO</h2>
        </div>
        <div className="grid gap-4 px-5 py-4 md:grid-cols-2">
          <label className="space-y-1.5 md:col-span-2">
            <span className="text-xs font-medium text-muted-foreground">Título SEO</span>
            <Input
              value={seoTitle}
              onChange={(e) => setSeoTitle(e.target.value)}
              placeholder="Título para buscadores"
            />
          </label>
          <label className="space-y-1.5 md:col-span-2">
            <span className="text-xs font-medium text-muted-foreground">Descripción SEO</span>
            <Textarea
              value={seoDescription}
              onChange={(e) => setSeoDescription(e.target.value)}
              placeholder="Descripción para buscadores"
              rows={3}
            />
          </label>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => router.push('/admin/productos')}>
          Cancelar
        </Button>
        <Button type="submit" disabled={busy}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Crear producto
        </Button>
      </div>
    </form>
  );
}