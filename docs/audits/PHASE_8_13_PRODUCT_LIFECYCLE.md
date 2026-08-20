# Fase 8.13 — Ciclo de vida de publicación de productos

## Objetivo

Cerrar el ciclo de vida de publicación de productos (DRAFT / ACTIVE / INACTIVE / ARCHIVED): readiness, publicar/desactivar/archivar/restaurar, transiciones válidas, lista de bloqueadores, CAS, RBAC `products.publish` y auditoría, desde el Product Editor del admin, garantizando que el catálogo público jamás exponga productos no publicables.

## Inspección previa (reutilizado)

- El dominio backend ya tenía el lifecycle completo: `product.aggregate.ts` (`activate`/`deactivate`/`archive`/`restore` con `assertCanTransitionTo`), `product-status.vo.ts` (matriz de transiciones) y `product-specifications.ts` (`ProductCanBePublished`: solo DRAFT/INACTIVE con `name`+`slug` no vacíos; `ProductCanBeArchived`). Se **reutilizaron esas reglas tal cual**, sin inventar requisitos comerciales.
- `Product.status` (`ProductStatus` enum), `Product.visibility`, `Product.version` (CAS) y `deletedAt` ya existían en el schema.
- RBAC/auditoría/tenant de 8.10.1, `requirePermission` y `can` de 8.11, patrón de rutas API admin de 8.12.
- No existe modelo de media/pricing obligatorio en el dominio → la readiness usa solo las reglas existentes (status + name + slug); NO se agregaron requisitos comerciales nuevos (variantes/precios/imágenes son warnings posibles en fases posteriores).

## Implementación

### Datos

- `AuditAction` ampliado: `PRODUCT_PUBLISH`, `PRODUCT_DEACTIVATE`, `PRODUCT_ARCHIVE`, `PRODUCT_RESTORE` (+ migración `20250819000004_add_product_lifecycle_audit`).
- RBAC: nuevo permiso `products.publish` en `rbac.ts` (`PERMISSIONS.PRODUCTS_PUBLISH` + ADMIN) y en el seed (`{ code: 'products.publish', resource: 'products', action: 'publish' }`).

### Lógica (`apps/frontend/src/lib/products/lifecycle.types.ts` — pura)

- `STATUS_TRANSITIONS` = matriz del dominio: DRAFT→[ACTIVE, ARCHIVED], ACTIVE→[INACTIVE, ARCHIVED], INACTIVE→[ACTIVE, ARCHIVED], ARCHIVED→[DRAFT] (restore).
- `getPublishReadiness` — espejo de `ProductCanBePublished`: solo DRAFT/INACTIVE y `name`+`slug` no vacíos; devuelve bloqueadores tipados.
- `getAllowedTransitions` / `canTransitionTo` / `STATUS_LABELS` / `AUDIT_ACTION_FOR_TARGET`.

### Servicio (`apps/frontend/src/lib/products/lifecycle.ts`)

- `getProductLifecycle(tenantId, id)` → `{ status, version, transitions, readiness }` (endpoint de estado + bloqueadores).
- `transitionProductStatus(tenantId, actor, id, target)`:
  - valida estado destino, existencia (tenant + no borrado) y transición válida;
  - si target = ACTIVE, exige `readiness.canPublish` (422 + lista de bloqueadores);
  - **CAS** vía `updateMany` con `version` actual e incremento → si `count === 0`, 409 (conflicto de concurrencia);
  - audita con la acción según target (PUBLISH/DEACTIVATE/ARCHIVE/RESTORE).

### Rutas API

- `api/admin/products/[id]/status` — GET: lifecycle (estado, version, transiciones, readiness/bloqueadores). POST: transición. RBAC: `products.manage` para lectura/resto, **`products.publish`** para publicar (target ACTIVE); 401/403 sin sesión/permiso.

### Admin (Product Editor)

- `/admin/productos/[id]` — nueva tarjeta **"Ciclo de vida"** (reemplaza el estado estático):
  - badge de estado + versión;
  - bloqueadores de publicación (lista) cuando DRAFT/INACTIVE y no listo;
  - acciones según transiciones válidas (Publicar / Desactivar / Archivar / Restaurar), con botón Publicar deshabilitado si hay bloqueadores;
  - errores 409/422 con mensaje y bloqueadores; re-fetch tras cada acción.
- `components/admin/lifecycle/lifecycle-actions.tsx` — componente cliente.

### Catálogo público

- `getProductRelationsForPdp` ahora exige producto fuente **publicable** (`status ACTIVE`, `visibility PUBLIC`, no borrado) y **filtra los targets de relaciones** por publicables. La fuente de destacados ya filtraba publicables (8.12). El catálogo público jamás expone DRAFT/INACTIVE/ARCHIVED ni `HIDDEN`/`PRIVATE`.

## Validación

- `pnpm --filter @tienda/frontend typecheck` ✅
- `pnpm --filter @tienda/database typecheck` ✅
- `pnpm --filter @tienda/backend typecheck` ✅ (schema ampliado no rompe backend)
- `pnpm --filter @tienda/frontend exec vitest run` ✅ (25 tests: +11 de lifecycle)
- `pnpm --filter @tienda/database build` (prisma generate) ✅
- `pnpm --filter @tienda/frontend build` ✅ (nueva ruta `/api/admin/products/[id]/status` y `/admin/productos/[id]` presentes)
- `lint`: roto repo-wide preexistente (no existe `eslint.config.*`), fuera de alcance.

## Criterios de aceptación

- [x] Readiness reutiliza reglas existentes de producto (status/name/slug), sin inventar requisitos.
- [x] Publicar/desactivar/archivar/restaurar con transiciones válidas (matriz del dominio).
- [x] Endpoint/lista de bloqueadores (GET status devuelve readiness + bloqueadores).
- [x] CAS (`Product.version`, 409 en conflicto) + RBAC `products.publish` + auditoría por acción.
- [x] Product Editor: estado, bloqueadores y acciones válidas visibles en la ficha.
- [x] Catálogo público no expone no-publicables (fuente y targets de relaciones filtrados).
- [x] Sin publicación programada (queda para 8.14).

## No hecho (fuera de alcance)

- Publicación programada / programación de estados (fase 8.14).
- Media/pricing como bloqueadores: el dominio no define reglas obligatorias de variante/precio/imagen → no se inventaron.
- Product Editor completo de edición de campos (no requerido por esta fase).

## Veredicto

PHASE_8_13_COMPLETED = YES