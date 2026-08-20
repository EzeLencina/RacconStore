# Fase 8.14 — Publicación programada

## Objetivo

Programar publicación/despublicación sobre el lifecycle de 8.13: `publishAt`, `unpublishAt`, publicar ahora, cancelar programación y estado efectivo, con cálculo determinista en lectura (sin jobs/Redis/BullMQ).

## Inspección previa (reutilizado)

- Lifecycle completo de 8.13: `lifecycle.types.ts`/`lifecycle.ts`, transiciones, readiness, CAS (`Product.version`), RBAC `products.publish` y auditoría.
- `Product` ya tenía `status`/`visibility`/`version`/`deletedAt`; se agregaron solo `publishAt`/`unpublishAt` (DateTime?, UTC).
- Catálogo público (8.13): `getProductRelationsForPdp` y `listFeaturedProducts` ya filtraban publicables; ahora filtran por **estado efectivo**.
- No existían jobs ni scheduler en el repo → **no se crearon**; la ventana se resuelve al leer.

## Implementación

### Datos

- `Product.publishAt` / `Product.unpublishAt` (`DateTime?`) + migración `20250819000005_add_scheduled_publication`.
- `AuditAction` ampliado: `PRODUCT_SCHEDULE`, `PRODUCT_CANCEL_SCHEDULE` (misma migración).

### Lógica (helpers puros, `lifecycle.types.ts`)

- `validateSchedule` — regla **unpublishAt > publishAt**; acepta nulos (limpiar ventana); rechaza fechas inválidas.
- `getEffectiveStatus({status, publishAt, unpublishAt}, now)` — **cálculo determinista en lectura** (UTC interno):
  - DRAFT/INACTIVE con `publishAt` pasado → ACTIVE efectivo; con `unpublishAt` pasado → INACTIVE.
  - ACTIVE con `publishAt` futuro → DRAFT efectivo (no expuesto); con `unpublishAt` pasado → INACTIVE.
  - ARCHIVED nunca se desarchiva por ventana.
- `isProductPublicable` — efectivo ACTIVE + `visibility PUBLIC` + sin borrar.

### Servicio (`lifecycle.ts`)

- `getProductLifecycle` ahora devuelve `effectiveStatus`, `publishAt`, `unpublishAt`, `hasSchedule`.
- `scheduleProductPublication(tenantId, actor, id, publishAt, unpublishAt)` — valida ventana, prohíbe ARCHIVED, **CAS** (`version` increment, 409 en conflicto), audita `PRODUCT_SCHEDULE`.
- `cancelProductSchedule(...)` — CAS, audita `PRODUCT_CANCEL_SCHEDULE`; rechaza si no hay programación.
- `transitionProductStatus` — al **publicar ahora** (ACTIVE) o **archivar** (ARCHIVED) limpia la programación pendiente (CAS + metadata `clearedSchedule`).

### Rutas API

- `api/admin/products/[id]/schedule` — GET lifecycle (estado + ventana), PUT programar, DELETE cancelar. RBAC: `products.publish` para escribir, `products.manage` para leer; 401/403.

### Admin (Product Editor)

- `components/admin/lifecycle/lifecycle-actions.tsx` — sección **"Publicación programada"**: inputs `datetime-local` (Publicar/Despublicar, hora local convertida a UTC en el envío), botones **Programar** / **Cancelar programación**, indicador de ventana programada, badge de **estado efectivo** cuando difiere del estado real, y botón **Publicar ahora** (limpiar programación).

### Catálogo público

- `getProductRelationsForPdp` — fuente y targets de relaciones filtrados con `isProductPublicable` (respeta ventana efectiva).
- `listFeaturedProducts` — destacados filtrados con `isProductPublicable`.

## Validación

- `pnpm --filter @tienda/frontend typecheck` ✅
- `pnpm --filter @tienda/database typecheck` ✅
- `pnpm --filter @tienda/backend typecheck` ✅ (schema ampliado no rompe backend)
- `pnpm --filter @tienda/frontend exec vitest run` ✅ (40 tests: +15 de scheduling)
- `pnpm --filter @tienda/database build` (prisma generate) ✅
- `pnpm --filter @tienda/frontend build` ✅ (nueva ruta `/api/admin/products/[id]/schedule` presente)
- `lint`: roto repo-wide preexistente (no existe `eslint.config.*`), fuera de alcance.

## Criterios de aceptación

- [x] Programar publicación/despublicación con `publishAt`/`unpublishAt` (UTC interno).
- [x] Publicar ahora (limpia programación) y cancelar programación.
- [x] Estado efectivo calculado en lectura (determinista, sin jobs/Redis/BullMQ).
- [x] `unpublishAt > publishAt` validado; CAS; tenant isolation; RBAC `products.publish`; auditoría por acción.
- [x] Product Editor con fecha/hora, estado programado y acciones.
- [x] Public Catalog respeta la ventana efectiva (relaciones + destacados).
- [x] Sin scheduler complejo; lifecycle de 8.13 intacto salvo el clear de schedule en publicar/archivar.

## No hecho (fuera de alcance)

- Jobs/scheduler reales para mutar `status` al vencimiento (no necesario: estado efectivo en lectura).
- Programación de visibilidad u otros campos.

## Veredicto

PHASE_8_14_COMPLETED = YES