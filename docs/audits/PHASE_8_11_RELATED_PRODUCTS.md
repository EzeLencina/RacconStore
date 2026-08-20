# Fase 8.11 — Productos relacionados

## Objetivo

Administrar y mostrar relaciones reales entre productos con tipos tipados, validación de integridad y RBAC, reutilizando la infraestructura de identidad/auditoría existente.

## Alcance

Tipos de relación: `RELATED`, `ALTERNATIVE`, `COMPLEMENTARY`.

## Inspección previa (reutilizado)

- Identidad/RBAC/auditoría de la fase 8.10.1: `@lib/auth/*` (session, guard, rbac, audit, tenant, prisma).
- Layout admin `(admin)/layout.tsx` + `AdminShell` + patrón de páginas `(admin)/admin/*`.
- Componentes PDP existentes (`RelatedProducts`, `CrossSelling`, `CatalogProductCard`).
- Patrón de migraciones + seed de `packages/database`.

## Implementación

### Datos (PostgreSQL)

- `ProductRelation` model + enum `ProductRelationType` (`RELATED`/`ALTERNATIVE`/`COMPLEMENTARY`).
  - Tenant-scoped (`tenantId`), `position` para orden, `updatedAt`.
  - `@@unique([tenantId, sourceProductId, targetProductId, type])` evita duplicados a nivel BD.
  - FK `sourceProductId`/`targetProductId` → `products` con `ON DELETE CASCADE`.
- `AuditAction` ampliado: `PRODUCT_RELATION_ADD`, `PRODUCT_RELATION_REMOVE`, `PRODUCT_RELATION_REORDER`.
- Migración `20250819000001_add_product_relations`.
- Seed: 3 productos demo (slugs alineados al PDP mock) + 4 relaciones.

### Lógica (`apps/frontend/src/lib/products/`)

- `relations.types.ts`: tipos puros y `toRelationCard` (testeables sin Prisma).
- `relations.ts` (server-side):
  - `listProductRelations` — por tipo, ordenado por posición.
  - `addProductRelation` — valida self-reference (400), mismo tenant, existencia del producto, duplicado (409), y asigna posición incremental; audita.
  - `removeProductRelation` — tenant-scoped, audita.
  - `reorderProductRelations` — transacción que reescribe posiciones; audita.
  - `searchProducts` — búsqueda paginada (`name`/`slug`, case-insensitive) con exclusión opcional del producto fuente.
  - `getProductRelationsForPdp` — resuelve relaciones reales para el PDP.

### RBAC

- Nuevo guard `requirePermission(PermissionCode)` en `lib/auth/guard.ts` (`can()` + session).
- Todas las rutas admin de relaciones exigen `products.manage` (ADMIN lo obtiene vía `can()`).
- API pública de PDP (`/api/products/[slug]/relations`) no requiere auth (catálogo público).

### Rutas API

- `api/admin/products/[id]/relations` — `GET` listar, `POST` agregar, `PATCH` reordenar, `DELETE` eliminar. 401/403 según sesión/permiso.
- `api/admin/products/search` — búsqueda paginada para el selector de productos.
- `api/products/[slug]/relations` — datos reales para el PDP (sin mocks).

### UI Admin

- `/admin/productos` — listado real de productos desde BD con enlace a "Relaciones" (paginado).
- `/admin/productos/[id]/relaciones` — sección de relaciones:
  - Tabs por tipo con contador.
  - Agregar vía buscador paginado (debounce 300ms) con exclusión del producto fuente.
  - Eliminar y reordenar (arriba/abajo) con PATCH transaccional.
  - Feedback de error/éxito y estados de carga.

### PDP

- Nuevo `ProductRelations` (cliente) consume `/api/products/[slug]/relations` y alimenta:
  - `RelatedProducts` (RELATED + ALTERNATIVE).
  - `CrossSelling` (COMPLEMENTARY) — sin total de precio si no hay precios (catálogo aún en fase mock).
- `RelatedProducts`/`CrossSelling` aceptan `items?: RelationCard[]` (relaciones reales) como fuente preferente.
- `CatalogProductCard` renderiza de forma defensiva cuando no hay precio/stock (datos reales sin pricing aún).

## Validación

- `pnpm --filter @tienda/frontend typecheck` ✅
- `pnpm --filter @tienda/database typecheck` ✅
- `pnpm --filter @tienda/backend typecheck` ✅ (schema ampliado no rompe backend)
- `pnpm --filter @tienda/frontend exec vitest run` ✅ (14 tests: auth/RBAC + relations helpers)
- `pnpm --filter @tienda/database build` (prisma generate) ✅
- `pnpm --filter @tienda/frontend build` ✅ (35 páginas; nuevas rutas admin y API presentes)
- `lint`: roto repo-wide preexistente (no existe `eslint.config.*`), fuera de alcance.

## Criterios de aceptación

- [x] CRUD de relaciones: listar/agregar/eliminar/reordenar.
- [x] Self-reference bloqueada (400) y duplicados bloqueados (409 + constraint BD).
- [x] Aislamiento multi-tenant: todas las queries filtran por `tenantId`.
- [x] RBAC: rutas admin exigen `products.manage`; 401/403 sin sesión/permiso.
- [x] Auditoría de add/remove/reorder en `AuditLog`.
- [x] Sección en `/admin/productos/[id]/relaciones` con búsqueda paginada.
- [x] PDP consume relaciones reales desde PostgreSQL (sin mocks); cae a vacío si no existen.

## No hecho (fuera de alcance)

- Motor de recomendaciones / IA.
- Duplicación del agregado `Product`.
- Wiring completo del catálogo (precios/imágenes/categorías desde BD) — fase posterior.
- Refactors externos.

## Veredicto

PHASE_8_11_COMPLETED = YES