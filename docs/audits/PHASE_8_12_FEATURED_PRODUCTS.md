# Fase 8.12 — Productos destacados

## Objetivo

Administrar productos destacados y mostrarlos realmente en el storefront, reutilizando la infraestructura existente (Collection FEATURED + ProductCollection) sin crear un módulo nuevo.

## Inspección previa (reutilizado)

- `Collection` con `type: FEATURED` y join `ProductCollection` con `displayOrder` ya existían en el schema → **no se creó un módulo nuevo**; se reutilizó como fuente de verdad de destacados.
- Producto: `Product` (status/visibility/deletedAt) para el filtro de publicables.
- RBAC/auditoría/tenant de 8.10.1 y `requirePermission` de 8.11.
- Patrón de grids reales de 8.11 (`CatalogProductCard`, `toRelationCard`).

## Implementación

### Datos

- Sin modelo nuevo para destacados (reutiliza `Collection` + `ProductCollection`).
- `AuditAction` ampliado: `PRODUCT_FEATURED_ADD`, `PRODUCT_FEATURED_REMOVE`, `PRODUCT_FEATURED_REORDER` (+ migración).
- Relaciones Prisma que faltaban en el join `ProductCollection` → `product`/`collection` (FK con CASCADE) + back-relations en `Product` y `Collection` (migración que solo agrega constraints).
- Seed: crea la colección FEATURED (`slug: destacados`) y marca 2 productos como destacados con `displayOrder` determinista.

### Lógica (`apps/frontend/src/lib/products/featured.ts`)

- `ensureFeaturedCollection` — upsert de la colección FEATURED por tenant (slug `destacados`).
- `listFeaturedProducts` — destacados ordenados por `displayOrder`; **solo publicables** (`deletedAt` null, `status ACTIVE`, `visibility PUBLIC`).
- `listFeaturedAdmin` — listado admin (incluye no-publicables) con orden.
- `setProductFeatured` — marcar/desmarcar con validación de producto (tenant + no eliminado); asigna `displayOrder` incremental; audita ADD/REMOVE.
- `reorderFeaturedProducts` — transacción que reescribe `displayOrder`; audita REORDER.

### RBAC

- Rutas admin: `products.manage` (401/403 sin sesión/permiso).
- API pública de destacados: sin auth (catálogo público).

### Rutas API

- `api/admin/products/[id]/featured` — GET estado, PUT marcar/desmarcar.
- `api/admin/products/featured` — GET listado admin, PATCH reorden.
- `api/public/featured` — GET productos destacados publicables (datos reales).

### Admin

- `/admin/productos/[id]` — ficha del producto con control **Marcar/Desmarcar destacado** (Product Editor) + estado.
- `/admin/productos/destacados` — gestión de destacados con reorden (arriba/abajo) y quitar.
- `/admin/productos` — botón de acceso a "Destacados".

### Storefront

- Home: `FeaturedProducts` ahora renderiza `<FeaturedGrid>` (cliente) que consume `/api/public/featured`; se **eliminó el mock `featuredProducts`** de `lib/home/mock-data` y su re-export.
- `/catalogo/destacados` — página pública real con los destacados (mismo grid).
- Orden determinista por `displayOrder`; solo publicables.

## Validación

- `pnpm --filter @tienda/frontend typecheck` ✅
- `pnpm --filter @tienda/database typecheck` ✅
- `pnpm --filter @tienda/backend typecheck` ✅ (schema ampliado no rompe backend)
- `pnpm --filter @tienda/frontend exec vitest run` ✅ (14 tests)
- `pnpm --filter @tienda/database build` (prisma generate) ✅
- `pnpm --filter @tienda/frontend build` ✅ (39 páginas; nuevas rutas admin/API presentes; Home y `/catalogo/destacados` estáticos)
- `lint`: roto repo-wide preexistente (no existe `eslint.config.*`), fuera de alcance.

## Criterios de aceptación

- [x] Marcar/desmarcar destacado desde la ficha del producto (Product Editor).
- [x] Orden determinista vía `ProductCollection.displayOrder` con reorden admin.
- [x] CAS transaccional, tenant-scoped, RBAC y auditoría (add/remove/reorder).
- [x] `/catalogo/destacados` real (datos desde PostgreSQL).
- [x] Home consume datos reales y el mock correspondiente fue eliminado.
- [x] Solo productos publicables (ACTIVE + PUBLIC, sin borrar) se muestran al público.

## No hecho (fuera de alcance)

- Otro módulo de "destacados": se reutilizó `Collection FEATURED`/`ProductCollection`.
- Componentes Home ajenos (Hero, Deals, Brands, etc.) y mock del catálogo general.
- Wiring completo de precios/imágenes del catálogo (fase posterior).

## Veredicto

PHASE_8_12_COMPLETED = YES