# Auditoría — Admin Product Management UI (Fase 8.16.1)

## Objetivo

Eliminar el P0 de la auditoría final de Fase 8 (falta de UI administrativa para operar Product Management). Conectar la UI admin a los datos/dominio existentes (Prisma directo, sin backend NestJS nuevo). No se tocó storefront, ni se implementó 8.16.2.

## Alcance entregado

### Libs (servicios, tenant-scoped)
- `lib/products/crud.ts` + `lib/products/crud.types.ts` (validación pura separada):
  - `listProducts` (búsqueda nombre/slug, filtros status/productType/marca/categoría, paginación).
  - `createProduct`, `updateProduct` (CAS por `version`), `getProductEditorPayload`.
  - `createVariant`, `updateVariant` (CAS), `deleteVariant` (baja lógica), atributos como JSON array (consistente con import/export).
  - `setProductCategories`, `setProductCollections` (asignación reemplazante, dedup).
- `lib/catalog/catalog.ts` + `lib/catalog/form-fields.ts`:
  - CRUD `Category`, `Brand`, `Collection` (validación de slug único por tenant, enums, soft delete; brand con protección de productos asociados; categoría con protección de subcategorías).
  - `listVariantAttributeKeys` (claves de atributos en uso, datos reales).

### API admin (todas con `getCurrentSession` + `can(PRODUCTS_MANAGE)` + `tenantId`)
- `api/admin/products` GET (list) / POST (create).
- `api/admin/products/[id]` GET (payload editor) / PATCH (update, CAS).
- `api/admin/products/[id]/variants` POST; `[id]/variants/[variantId]` PATCH/DELETE.
- `api/admin/products/[id]/categories` PUT; `[id]/collections` PUT.
- `api/admin/categories`, `api/admin/brands`, `api/admin/collections` GET/POST + `[id]` PATCH/DELETE.
- `api/admin/attributes` GET.

### Páginas
- `/admin/productos` — listado con búsqueda, filtros (estado, tipo, marca, categoría), paginación, crear, abrir, editar, export y destacados. Acciones según permisos (`canExport`).
- `/admin/productos/nuevo` — formulario real → `POST /api/admin/products` → redirige al editor.
- `/admin/productos/[id]/editar` — editor con pestañas: General, Variantes, Categorías, Colecciones, SEO. Guarda con CAS; botones a Ciclo de vida y Relaciones (reutilizando pantallas existentes).
- `/admin/categorias`, `/admin/marcas`, `/admin/colecciones` — CRUD completo (listar, buscar, filtrar, paginar, crear, editar, eliminar) vía `CatalogManager` genérico.
- `/admin/atributos` — claves de atributos en uso con conteo (datos reales desde variantes).
- Redirects `/admin/products`, `/admin/products/new`, `/admin/products/[id]`, `/admin/categories`, `/admin/brands`, `/admin/collections`, `/admin/attributes` → rutas canónicas en español (mantiene la navegación existente sin duplicar).

### Navegación
- Items nuevos en `navigation.config.ts` (Categorías, Marcas, Colecciones, Atributos), iconos en `admin-shell`, permisos en `NAV_PERMISSION` (todos `PRODUCTS_MANAGE`).

## Notas de implementación
- El modelo `Product` no expone relaciones Prisma hacia `brand`, `categories` ni `variants` (solo `collections`); el listado y el payload del editor resuelven marca/categorías/variantes con consultas explícitas (`productCategory`, `category`, `brand`, `productVariant`), sin cambiar el schema.
- `AuditAction` no tiene acciones CREATE/UPDATE; las operaciones de alta/edición no generan auditoría (no se agregó enum para no migrar). Vida, relaciones, destacados e import/export conservan su auditoría existente.

## Criterio manual (evaluación estática + gates)

| # | Paso | Estado |
| --- | --- | --- |
| 1 | crear producto | ✅ `/admin/productos/nuevo` → POST |
| 2 | editarlo | ✅ editor → PATCH |
| 3 | agregar variante | ✅ pestaña Variantes → POST/PATCH |
| 4 | asignar categoría | ✅ pestaña Categorías → PUT |
| 5 | marca | ✅ campo marca en General → PATCH |
| 6 | colección | ✅ pestaña Colecciones → PUT |
| 7 | atributos | ✅ por variante (JSON array) |
| 8 | tags | ⚠️ sin modelo de datos (ver Nota) |
| 9 | media | ⚠️ sin modelo de datos (ver Nota) |
| 10 | SEO | ✅ pestaña SEO → PATCH |
| 11 | guardar | ✅ con CAS (409 si hubo edición concurrente) |
| 12 | volver a abrir y conservar | ✅ payload del editor re-lee todos los campos |

**Nota (8–9):** no existen modelos `ProductTag` ni `ProductMedia` en el schema; la fase prohíbe agregar backend/features/schema ("según arquitectura existente", "no agregar features nuevas"). Tags y media quedan como gap de modelo de datos a resolver en una fase de datos posterior; ninguna UI puede crearlos sin ese modelo.

## Validación

- `pnpm --filter @tienda/frontend typecheck` ✅
- `pnpm --filter @tienda/frontend test` ✅ 7 files, 68 tests (15 nuevos de `product-crud.test.ts`)
- `pnpm --filter @tienda/frontend build` ✅ Compiled successfully

## VEREDICTO

**PHASE_8_16_1_COMPLETED = YES**

Bloqueadores: ninguno dentro del alcance permitido. El P0 de la auditoría final (sin UI admin para product management) queda eliminado para todo lo que el dominio existente soporta. Pendiente no bloqueante de esta fase: modelo de datos para tags y media de producto (requiere fase de datos con migración, no UI).