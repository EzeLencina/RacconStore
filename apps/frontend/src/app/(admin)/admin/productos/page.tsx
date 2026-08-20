import type { Metadata } from 'next';
import Link from 'next/link';
import { Download, Package, Plus, Star, SearchX } from 'lucide-react';
import { requirePermission } from '@lib/auth';
import { can, PERMISSIONS } from '@lib/auth/rbac';
import { getTenantId } from '@lib/auth/tenant';
import { prisma } from '@lib/auth/prisma';
import { listProducts, PRODUCT_STATUSES, PRODUCT_TYPES } from '@lib/products/crud';
import { Button } from '@tienda/ui';

export const metadata: Metadata = {
  title: 'Productos | Admin',
  robots: { index: false, follow: false },
};

const PAGE_SIZE = 20;

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    q?: string;
    status?: string;
    productType?: string;
    brandId?: string;
    categoryId?: string;
  }>;
}) {
  const session = await requirePermission(PERMISSIONS.PRODUCTS_MANAGE);
  const canExport = can(session.roles, session.permissions, PERMISSIONS.PRODUCTS_EXPORT);

  const params = await searchParams;
  const tenantId = getTenantId();
  const page = Math.max(1, Number(params.page) || 1);
  const q = params.q?.trim() || undefined;
  const status = params.status || undefined;
  const productType = params.productType || undefined;
  const brandId = params.brandId || undefined;
  const categoryId = params.categoryId || undefined;

  const [brands, categories, result] = await Promise.all([
    prisma.brand.findMany({
      where: { tenantId, deletedAt: null },
      orderBy: { name: 'asc' },
      select: { id: true, name: true },
    }),
    prisma.category.findMany({
      where: { tenantId, deletedAt: null },
      orderBy: { name: 'asc' },
      select: { id: true, name: true },
    }),
    listProducts(
      tenantId,
      { q, status, productType, brandId, categoryId },
      page,
      PAGE_SIZE,
    ),
  ]);

  const totalPages = Math.max(1, Math.ceil(result.total / PAGE_SIZE));

  const buildQuery = (overrides: Record<string, string | undefined>) => {
    const usp = new URLSearchParams();
    const merged = { q, status, productType, brandId, categoryId, ...overrides };
    for (const [key, value] of Object.entries(merged)) {
      if (value) usp.set(key, value);
    }
    const qs = usp.toString();
    return qs ? `?${qs}` : '';
  };

  const hasFilters = Boolean(q || status || productType || brandId || categoryId);

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Productos</h1>
          <div className="flex items-center gap-2">
            {canExport ? (
              <a href="/api/admin/products/export">
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4" /> Exportar CSV
                </Button>
              </a>
            ) : null}
            <Link href="/admin/productos/destacados">
              <Button variant="outline" size="sm">
                <Star className="h-4 w-4" /> Destacados
              </Button>
            </Link>
            <Link href="/admin/productos/nuevo">
              <Button size="sm">
                <Plus className="h-4 w-4" /> Nuevo producto
              </Button>
            </Link>
          </div>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Gestioná el catálogo: creá, editá y organizá tus productos.
        </p>
      </div>

      <form method="get" action="/admin/productos" className="rounded-xl border border-border bg-card">
        <div className="flex flex-col gap-3 border-b border-border px-5 py-4 lg:flex-row lg:items-end">
          <label className="flex-1 space-y-1.5">
            <span className="text-xs font-medium text-muted-foreground">Buscar</span>
            <input
              type="search"
              name="q"
              defaultValue={q}
              placeholder="Nombre, slug o marca…"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary"
            />
          </label>
          <label className="space-y-1.5">
            <span className="text-xs font-medium text-muted-foreground">Estado</span>
            <select
              name="status"
              defaultValue={status}
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary"
            >
              <option value="">Todos</option>
              {PRODUCT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1.5">
            <span className="text-xs font-medium text-muted-foreground">Tipo</span>
            <select
              name="productType"
              defaultValue={productType}
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary"
            >
              <option value="">Todos</option>
              {PRODUCT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1.5">
            <span className="text-xs font-medium text-muted-foreground">Marca</span>
            <select
              name="brandId"
              defaultValue={brandId}
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary"
            >
              <option value="">Todas</option>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1.5">
            <span className="text-xs font-medium text-muted-foreground">Categoría</span>
            <select
              name="categoryId"
              defaultValue={categoryId}
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary"
            >
              <option value="">Todas</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <div className="flex gap-2">
            <Button type="submit" size="sm">
              Buscar
            </Button>
            {hasFilters ? (
              <Link href="/admin/productos">
                <Button type="button" variant="outline" size="sm">
                  Limpiar
                </Button>
              </Link>
            ) : null}
          </div>
        </div>
      </form>

      <div className="rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <span className="text-sm font-medium text-foreground">
            {result.total} {result.total === 1 ? 'producto' : 'productos'}
          </span>
        </div>

        {result.items.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
            <SearchX className="h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              {hasFilters ? 'No hay productos que coincidan con la búsqueda.' : 'No hay productos creados todavía.'}
            </p>
            {hasFilters ? (
              <Link href="/admin/productos">
                <Button variant="outline" size="sm">Limpiar filtros</Button>
              </Link>
            ) : null}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="px-5 py-3 font-medium">Nombre</th>
                  <th className="hidden px-5 py-3 font-medium md:table-cell">Marca</th>
                  <th className="hidden px-5 py-3 font-medium lg:table-cell">Categorías</th>
                  <th className="px-5 py-3 font-medium">Estado</th>
                  <th className="px-5 py-3 font-medium text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {result.items.map((product) => (
                  <tr key={product.id} className="border-b border-border last:border-0">
                    <td className="px-5 py-3">
                      <Link
                        href={`/admin/productos/${product.id}/editar`}
                        className="font-medium text-foreground hover:text-primary"
                      >
                        {product.name}
                      </Link>
                      <p className="text-xs text-muted-foreground">{product.slug}</p>
                    </td>
                    <td className="hidden px-5 py-3 text-muted-foreground md:table-cell">
                      {product.brand?.name ?? '—'}
                    </td>
                    <td className="hidden px-5 py-3 text-muted-foreground lg:table-cell">
                      {product.categories.length > 0
                        ? product.categories.map((c) => c.category.name).join(', ')
                        : '—'}
                    </td>
                    <td className="px-5 py-3">
                      <span className="rounded-full border border-border bg-muted px-2 py-0.5 text-xs">
                        {product.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <Link
                          href={`/admin/productos/${product.id}/relaciones`}
                          className="text-xs text-muted-foreground hover:text-primary"
                        >
                          Relaciones
                        </Link>
                        <Link
                          href={`/admin/productos/${product.id}/editar`}
                          className="inline-flex items-center gap-1 text-primary hover:underline"
                        >
                          Editar →
                        </Link>
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
              <Link href={`/admin/productos${buildQuery({ page: String(page - 1) })}`}>
                <Button variant="outline" size="sm">Anterior</Button>
              </Link>
            ) : null}
            {page < totalPages ? (
              <Link href={`/admin/productos${buildQuery({ page: String(page + 1) })}`}>
                <Button variant="outline" size="sm">Siguiente</Button>
              </Link>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}