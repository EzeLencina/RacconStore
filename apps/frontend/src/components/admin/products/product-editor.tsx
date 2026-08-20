'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  Plus,
  Pencil,
  Trash2,
  X,
} from 'lucide-react';
import { Button, Input, Select, Textarea, Checkbox, Tabs, TabsList, TabsTrigger, TabsContent, Badge } from '@tienda/ui';
import {
  PRODUCT_TYPES,
  PRODUCT_STATUSES,
  PRODUCT_VISIBILITIES,
  PRODUCT_CONDITIONS,
  VARIANT_STATUSES,
} from '@lib/products/crud';

export type EditorVariant = {
  id: string;
  sku: string;
  name: string | null;
  barcode: string | null;
  status: string;
  isDefault: boolean;
  version: number;
  attributes: Array<{ key: string; value: string | number | boolean }>;
};

export type EditorRef = { id: string; name: string; slug: string };

export type EditorPayload = {
  id: string;
  name: string;
  slug: string;
  shortDescription: string | null;
  description: string | null;
  productType: string;
  status: string;
  visibility: string;
  condition: string;
  warrantyMonths: number | null;
  brandId: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  version: number;
  publishAt: string | null;
  unpublishAt: string | null;
  variants: EditorVariant[];
  categories: EditorRef[];
  collections: EditorRef[];
};

type ProductEditorProps = {
  initial: EditorPayload;
  brands: { id: string; name: string }[];
  allCategories: EditorRef[];
  allCollections: EditorRef[];
};

const emptyVariant = {
  sku: '',
  name: '',
  barcode: '',
  status: 'ACTIVE',
  isDefault: false,
  attributes: [] as { key: string; value: string | number | boolean }[],
};

export function ProductEditor({ initial, brands, allCategories, allCollections }: ProductEditorProps) {
  const [product, setProduct] = useState<EditorPayload>(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [general, setGeneral] = useState({
    name: initial.name,
    slug: initial.slug,
    shortDescription: initial.shortDescription ?? '',
    description: initial.description ?? '',
    productType: initial.productType,
    status: initial.status,
    visibility: initial.visibility,
    condition: initial.condition,
    warrantyMonths: initial.warrantyMonths === null ? '' : String(initial.warrantyMonths),
    brandId: initial.brandId ?? '',
  });
  const [seo, setSeo] = useState({
    seoTitle: initial.seoTitle ?? '',
    seoDescription: initial.seoDescription ?? '',
  });
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    initial.categories.map((c) => c.id),
  );
  const [selectedCollections, setSelectedCollections] = useState<string[]>(
    initial.collections.map((c) => c.id),
  );

  const [showVariantForm, setShowVariantForm] = useState(false);
  const [variantForm, setVariantForm] = useState(emptyVariant);
  const [editingVariantId, setEditingVariantId] = useState<string | null>(null);
  const [savingVariantId, setSavingVariantId] = useState<string | null>(null);

  const reload = useCallback(async () => {
    const response = await fetch(`/api/admin/products/${product.id}`);
    if (!response.ok) {
      setError('No se pudo recargar el producto');
      return;
    }
    const data = (await response.json()) as EditorPayload;
    setProduct(data);
    setGeneral({
      name: data.name,
      slug: data.slug,
      shortDescription: data.shortDescription ?? '',
      description: data.description ?? '',
      productType: data.productType,
      status: data.status,
      visibility: data.visibility,
      condition: data.condition,
      warrantyMonths: data.warrantyMonths === null ? '' : String(data.warrantyMonths),
      brandId: data.brandId ?? '',
    });
    setSeo({ seoTitle: data.seoTitle ?? '', seoDescription: data.seoDescription ?? '' });
    setSelectedCategories(data.categories.map((c) => c.id));
    setSelectedCollections(data.collections.map((c) => c.id));
  }, [product.id]);

  async function patchProduct(input: Record<string, unknown>) {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const response = await fetch(`/api/admin/products/${product.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input, expectedVersion: product.version }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setError(data?.error ?? 'No se pudo guardar');
        return false;
      }
      setProduct((prev) => ({ ...prev, version: data.version }));
      setNotice('Guardado');
      return true;
    } catch {
      setError('Error de conexión');
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function saveGeneral(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!general.name.trim()) {
      setError('El nombre es obligatorio');
      return;
    }
    await patchProduct({
      name: general.name.trim(),
      slug: general.slug.trim() || undefined,
      shortDescription: general.shortDescription.trim() || null,
      description: general.description.trim() || null,
      productType: general.productType,
      status: general.status,
      visibility: general.visibility,
      condition: general.condition,
      warrantyMonths: general.warrantyMonths === '' ? null : Number(general.warrantyMonths),
      brandId: general.brandId || null,
      seoTitle: seo.seoTitle.trim() || null,
      seoDescription: seo.seoDescription.trim() || null,
    });
  }

  async function saveSeo(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await patchProduct({
      name: general.name,
      slug: general.slug,
      shortDescription: general.shortDescription || null,
      description: general.description || null,
      productType: general.productType,
      status: general.status,
      visibility: general.visibility,
      condition: general.condition,
      warrantyMonths: general.warrantyMonths === '' ? null : Number(general.warrantyMonths),
      brandId: general.brandId || null,
      seoTitle: seo.seoTitle.trim() || null,
      seoDescription: seo.seoDescription.trim() || null,
    });
  }

  async function saveCategories() {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const response = await fetch(`/api/admin/products/${product.id}/categories`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categoryIds: selectedCategories }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setError(data?.error ?? 'No se pudieron guardar las categorías');
        return;
      }
      setNotice('Categorías guardadas');
    } catch {
      setError('Error de conexión');
    } finally {
      setBusy(false);
    }
  }

  async function saveCollections() {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const response = await fetch(`/api/admin/products/${product.id}/collections`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ collectionIds: selectedCollections }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setError(data?.error ?? 'No se pudieron guardar las colecciones');
        return;
      }
      setNotice('Colecciones guardadas');
    } catch {
      setError('Error de conexión');
    } finally {
      setBusy(false);
    }
  }

  async function createVariant(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!variantForm.sku.trim()) {
      setError('El SKU es obligatorio');
      return;
    }
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const response = await fetch(`/api/admin/products/${product.id}/variants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sku: variantForm.sku.trim(),
          name: variantForm.name.trim() || null,
          barcode: variantForm.barcode.trim() || null,
          status: variantForm.status,
          isDefault: variantForm.isDefault,
          attributes: variantForm.attributes,
        }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setError(data?.error ?? 'No se pudo crear la variante');
        return;
      }
      setShowVariantForm(false);
      setVariantForm(emptyVariant);
      setNotice('Variante creada');
      await reload();
    } catch {
      setError('Error de conexión');
    } finally {
      setBusy(false);
    }
  }

  async function saveVariant(id: string) {
    const target = product.variants.find((v) => v.id === id);
    if (!target) return;
    if (!variantForm.sku.trim()) {
      setError('El SKU es obligatorio');
      return;
    }
    setSavingVariantId(id);
    setError(null);
    setNotice(null);
    try {
      const response = await fetch(`/api/admin/products/${product.id}/variants/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: {
            sku: variantForm.sku.trim(),
            name: variantForm.name.trim() || null,
            barcode: variantForm.barcode.trim() || null,
            status: variantForm.status,
            isDefault: variantForm.isDefault,
            attributes: variantForm.attributes,
          },
          expectedVersion: target.version,
        }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setError(data?.error ?? 'No se pudo guardar la variante');
        return;
      }
      setEditingVariantId(null);
      setVariantForm(emptyVariant);
      setNotice('Variante guardada');
      await reload();
    } catch {
      setError('Error de conexión');
    } finally {
      setSavingVariantId(null);
    }
  }

  async function deleteVariant(id: string) {
    if (!window.confirm('¿Eliminar esta variante?')) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const response = await fetch(`/api/admin/products/${product.id}/variants/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        setError(data?.error ?? 'No se pudo eliminar la variante');
        return;
      }
      setEditingVariantId(null);
      setVariantForm(emptyVariant);
      setNotice('Variante eliminada');
      await reload();
    } catch {
      setError('Error de conexión');
    } finally {
      setBusy(false);
    }
  }

  function startEditVariant(id: string) {
    const v = product.variants.find((x) => x.id === id);
    if (!v) return;
    setVariantForm({
      sku: v.sku,
      name: v.name ?? '',
      barcode: v.barcode ?? '',
      status: v.status,
      isDefault: v.isDefault,
      attributes: v.attributes,
    });
    setEditingVariantId(id);
    setShowVariantForm(false);
  }

  function updateAttribute(index: number, key: string, value: string) {
    const next = variantForm.attributes.slice();
    const existing = next[index];
    if (existing) {
      existing.key = key;
      existing.value = value;
    }
    setVariantForm((prev) => ({ ...prev, attributes: next }));
  }

  function addAttribute() {
    setVariantForm((prev) => ({
      ...prev,
      attributes: [...prev.attributes, { key: '', value: '' }],
    }));
  }

  function removeAttribute(index: number) {
    setVariantForm((prev) => ({
      ...prev,
      attributes: prev.attributes.filter((_, i) => i !== index),
    }));
  }

  const hasVariants = product.variants.length > 0;

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/admin/productos"
              className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            >
              ← Productos
            </Link>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">{product.name}</h1>
            <Badge variant="secondary" size="sm">{product.status}</Badge>
          </div>
          <div className="flex items-center gap-2">
            <Link href={`/admin/productos/${product.id}`}>
              <Button variant="outline" size="sm">Ciclo de vida</Button>
            </Link>
            <Link href={`/admin/productos/${product.id}/relaciones`}>
              <Button variant="outline" size="sm">Relaciones</Button>
            </Link>
          </div>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">Slug: {product.slug}</p>
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

      <Tabs defaultValue="general">
        <TabsList className="flex flex-wrap h-auto">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="variantes">Variantes ({product.variants.length})</TabsTrigger>
          <TabsTrigger value="categorias">Categorías</TabsTrigger>
          <TabsTrigger value="colecciones">Colecciones</TabsTrigger>
          <TabsTrigger value="seo">SEO</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <form onSubmit={saveGeneral} className="rounded-xl border border-border bg-card">
            <div className="border-b border-border px-5 py-3">
              <h2 className="text-sm font-medium text-foreground">Datos generales</h2>
            </div>
            <div className="grid gap-4 px-5 py-4 md:grid-cols-2">
              <label className="space-y-1.5 md:col-span-2">
                <span className="text-xs font-medium text-muted-foreground">Nombre *</span>
                <Input
                  value={general.name}
                  onChange={(e) => setGeneral((p) => ({ ...p, name: e.target.value }))}
                  required
                />
              </label>
              <label className="space-y-1.5 md:col-span-2">
                <span className="text-xs font-medium text-muted-foreground">Slug</span>
                <Input
                  value={general.slug}
                  onChange={(e) => setGeneral((p) => ({ ...p, slug: e.target.value }))}
                />
              </label>
              <label className="space-y-1.5 md:col-span-2">
                <span className="text-xs font-medium text-muted-foreground">Descripción corta</span>
                <Input
                  value={general.shortDescription}
                  onChange={(e) => setGeneral((p) => ({ ...p, shortDescription: e.target.value }))}
                />
              </label>
              <label className="space-y-1.5 md:col-span-2">
                <span className="text-xs font-medium text-muted-foreground">Descripción</span>
                <Textarea
                  value={general.description}
                  onChange={(e) => setGeneral((p) => ({ ...p, description: e.target.value }))}
                  rows={5}
                />
              </label>
              <label className="space-y-1.5">
                <span className="text-xs font-medium text-muted-foreground">Tipo</span>
                <Select
                  value={general.productType}
                  onChange={(e) => setGeneral((p) => ({ ...p, productType: e.target.value }))}
                >
                  {PRODUCT_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </Select>
              </label>
              <label className="space-y-1.5">
                <span className="text-xs font-medium text-muted-foreground">Estado</span>
                <Select
                  value={general.status}
                  onChange={(e) => setGeneral((p) => ({ ...p, status: e.target.value }))}
                >
                  {PRODUCT_STATUSES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </Select>
              </label>
              <label className="space-y-1.5">
                <span className="text-xs font-medium text-muted-foreground">Visibilidad</span>
                <Select
                  value={general.visibility}
                  onChange={(e) => setGeneral((p) => ({ ...p, visibility: e.target.value }))}
                >
                  {PRODUCT_VISIBILITIES.map((v) => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </Select>
              </label>
              <label className="space-y-1.5">
                <span className="text-xs font-medium text-muted-foreground">Condición</span>
                <Select
                  value={general.condition}
                  onChange={(e) => setGeneral((p) => ({ ...p, condition: e.target.value }))}
                >
                  {PRODUCT_CONDITIONS.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </Select>
              </label>
              <label className="space-y-1.5">
                <span className="text-xs font-medium text-muted-foreground">Garantía (meses)</span>
                <Input
                  type="number"
                  min={0}
                  value={general.warrantyMonths}
                  onChange={(e) => setGeneral((p) => ({ ...p, warrantyMonths: e.target.value }))}
                />
              </label>
              <label className="space-y-1.5">
                <span className="text-xs font-medium text-muted-foreground">Marca</span>
                <Select
                  value={general.brandId}
                  onChange={(e) => setGeneral((p) => ({ ...p, brandId: e.target.value }))}
                >
                  <option value="">Sin marca</option>
                  {brands.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </Select>
              </label>
            </div>
            <div className="flex justify-end border-t border-border px-5 py-3">
              <Button type="submit" disabled={busy}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Guardar
              </Button>
            </div>
          </form>
        </TabsContent>

        <TabsContent value="variantes">
          <div className="rounded-xl border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border px-5 py-3">
              <h2 className="text-sm font-medium text-foreground">Variantes / SKU</h2>
              <Button size="sm" variant="outline" onClick={() => { setShowVariantForm((v) => !v); setEditingVariantId(null); setVariantForm(emptyVariant); }}>
                <Plus className="h-4 w-4" /> Nueva variante
              </Button>
            </div>
            <div className="p-5">
              {showVariantForm ? (
                <form
                  onSubmit={createVariant}
                  className="mb-5 space-y-4 rounded-lg border border-border bg-background p-4"
                >
                  <VariantFields
                    form={variantForm}
                    setForm={setVariantForm}
                    updateAttribute={updateAttribute}
                    addAttribute={addAttribute}
                    removeAttribute={removeAttribute}
                  />
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowVariantForm(false)}
                    >
                      Cancelar
                    </Button>
                    <Button type="submit" size="sm" disabled={busy}>Crear variante</Button>
                  </div>
                </form>
              ) : null}

              {!hasVariants && !showVariantForm ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  Sin variantes. Agregá una para gestionar SKUs, atributos y stock.
                </p>
              ) : (
                <ul className="space-y-3">
                  {product.variants.map((variant) => (
                    <li key={variant.id} className="rounded-lg border border-border bg-background p-4">
                      {editingVariantId === variant.id ? (
                        <form
                          onSubmit={(e) => { e.preventDefault(); void saveVariant(variant.id); }}
                          className="space-y-4"
                        >
                          <VariantFields
                            form={variantForm}
                            setForm={setVariantForm}
                            updateAttribute={updateAttribute}
                            addAttribute={addAttribute}
                            removeAttribute={removeAttribute}
                          />
                          <div className="flex justify-end gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => { setEditingVariantId(null); setVariantForm(emptyVariant); }}
                            >
                              Cancelar
                            </Button>
                            <Button type="submit" size="sm" disabled={savingVariantId === variant.id}>
                              {savingVariantId === variant.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : null}
                              Guardar
                            </Button>
                          </div>
                        </form>
                      ) : (
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-medium text-foreground">{variant.sku}</span>
                              {variant.isDefault ? (
                                <Badge variant="secondary" size="sm">default</Badge>
                              ) : null}
                              <Badge variant="outline" size="sm">{variant.status}</Badge>
                            </div>
                            <p className="truncate text-xs text-muted-foreground">
                              {variant.name || 'Sin nombre'}
                              {variant.barcode ? ` · ${variant.barcode}` : ''}
                              {variant.attributes.length > 0
                                ? ` · ${variant.attributes.map((a) => `${a.key}=${a.value}`).join(', ')}`
                                : ''}
                            </p>
                          </div>
                          <div className="flex shrink-0 items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => startEditVariant(variant.id)}
                              aria-label={`Editar ${variant.sku}`}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                              onClick={() => void deleteVariant(variant.id)}
                              aria-label={`Eliminar ${variant.sku}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="categorias">
          <div className="rounded-xl border border-border bg-card">
            <div className="border-b border-border px-5 py-3">
              <h2 className="text-sm font-medium text-foreground">Categorías</h2>
            </div>
            <div className="p-5">
              {allCategories.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  No hay categorías creadas.{' '}
                  <Link href="/admin/categorias" className="text-primary hover:underline">
                    Creá una en Categorías
                  </Link>
                  .
                </p>
              ) : (
                <ul className="grid gap-2 md:grid-cols-2">
                  {allCategories.map((category) => (
                    <li key={category.id}>
                      <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm">
                        <Checkbox
                          checked={selectedCategories.includes(category.id)}
                          onCheckedChange={(checked) =>
                            setSelectedCategories((prev) =>
                              checked ? [...prev, category.id] : prev.filter((id) => id !== category.id),
                            )
                          }
                        />
                        <span className="min-w-0">
                          <span className="block truncate font-medium">{category.name}</span>
                          <span className="block truncate text-xs text-muted-foreground">{category.slug}</span>
                        </span>
                      </label>
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-4 flex justify-end">
                <Button onClick={() => void saveCategories()} disabled={busy}>
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Guardar categorías
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="colecciones">
          <div className="rounded-xl border border-border bg-card">
            <div className="border-b border-border px-5 py-3">
              <h2 className="text-sm font-medium text-foreground">Colecciones</h2>
            </div>
            <div className="p-5">
              {allCollections.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  No hay colecciones creadas.{' '}
                  <Link href="/admin/colecciones" className="text-primary hover:underline">
                    Creá una en Colecciones
                  </Link>
                  .
                </p>
              ) : (
                <ul className="grid gap-2 md:grid-cols-2">
                  {allCollections.map((collection) => (
                    <li key={collection.id}>
                      <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm">
                        <Checkbox
                          checked={selectedCollections.includes(collection.id)}
                          onCheckedChange={(checked) =>
                            setSelectedCollections((prev) =>
                              checked ? [...prev, collection.id] : prev.filter((id) => id !== collection.id),
                            )
                          }
                        />
                        <span className="min-w-0">
                          <span className="block truncate font-medium">{collection.name}</span>
                          <span className="block truncate text-xs text-muted-foreground">{collection.slug}</span>
                        </span>
                      </label>
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-4 flex justify-end">
                <Button onClick={() => void saveCollections()} disabled={busy}>
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Guardar colecciones
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="seo">
          <form onSubmit={saveSeo} className="rounded-xl border border-border bg-card">
            <div className="border-b border-border px-5 py-3">
              <h2 className="text-sm font-medium text-foreground">SEO</h2>
            </div>
            <div className="grid gap-4 px-5 py-4">
              <label className="space-y-1.5">
                <span className="text-xs font-medium text-muted-foreground">Título SEO</span>
                <Input
                  value={seo.seoTitle}
                  onChange={(e) => setSeo((p) => ({ ...p, seoTitle: e.target.value }))}
                />
              </label>
              <label className="space-y-1.5">
                <span className="text-xs font-medium text-muted-foreground">Descripción SEO</span>
                <Textarea
                  value={seo.seoDescription}
                  onChange={(e) => setSeo((p) => ({ ...p, seoDescription: e.target.value }))}
                  rows={3}
                />
              </label>
            </div>
            <div className="flex justify-end border-t border-border px-5 py-3">
              <Button type="submit" disabled={busy}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Guardar SEO
              </Button>
            </div>
          </form>
        </TabsContent>
      </Tabs>
    </div>
  );
}

type VariantFieldsProps = {
  form: typeof emptyVariant;
  setForm: React.Dispatch<React.SetStateAction<typeof emptyVariant>>;
  updateAttribute: (index: number, key: string, value: string) => void;
  addAttribute: () => void;
  removeAttribute: (index: number) => void;
};

function VariantFields({ form, setForm, updateAttribute, addAttribute, removeAttribute }: VariantFieldsProps) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-1.5">
          <span className="text-xs font-medium text-muted-foreground">SKU *</span>
          <Input
            value={form.sku}
            onChange={(e) => setForm((p) => ({ ...p, sku: e.target.value }))}
            placeholder="ej: AUR-PRO-NEGRO"
            required
          />
        </label>
        <label className="space-y-1.5">
          <span className="text-xs font-medium text-muted-foreground">Nombre</span>
          <Input
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            placeholder="ej: Negro 8GB"
          />
        </label>
        <label className="space-y-1.5">
          <span className="text-xs font-medium text-muted-foreground">Código de barras</span>
          <Input
            value={form.barcode}
            onChange={(e) => setForm((p) => ({ ...p, barcode: e.target.value }))}
            placeholder="EAN/UPC"
          />
        </label>
        <label className="space-y-1.5">
          <span className="text-xs font-medium text-muted-foreground">Estado</span>
          <Select value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}>
            {VARIANT_STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </Select>
        </label>
        <label className="flex items-center gap-2 text-sm">
          <Checkbox
            checked={form.isDefault}
            onCheckedChange={(checked) => setForm((p) => ({ ...p, isDefault: checked === true }))}
          />
          Variante por defecto
        </label>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">Atributos</span>
          <Button type="button" variant="outline" size="sm" onClick={addAttribute}>
            <Plus className="h-3.5 w-3.5" /> Agregar atributo
          </Button>
        </div>
        {form.attributes.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            Sin atributos. Ej: color, talla, material…
          </p>
        ) : (
          <ul className="space-y-2">
            {form.attributes.map((attr, index) => (
              <li key={index} className="flex items-center gap-2">
                <Input
                  value={attr.key}
                  placeholder="key (ej: color)"
                  className="flex-1"
                  onChange={(e) => updateAttribute(index, e.target.value, String(attr.value))}
                />
                <Input
                  value={String(attr.value)}
                  placeholder="valor (ej: negro)"
                  className="flex-1"
                  onChange={(e) => updateAttribute(index, attr.key, e.target.value)}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Quitar atributo"
                  onClick={() => removeAttribute(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}