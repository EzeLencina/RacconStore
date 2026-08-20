# Fase 8.15.1 — Import/Export core (backend)

## Objetivo

Implementar import/export seguro de productos (CSV) en el backend NestJS: export de campos reales, e import con flujo upload → parse → validar → preview/dry-run → confirmar → resultado. Sin frontend todavía.

## Inspección previa (reutilizado)

- Módulo products (DDD) y validadores de dominio existentes; `PrismaService` global (`@core`/`DatabaseModule`).
- Modelos reales: `Product` (slug/name/status/visibility/condition/warranty/seo), `ProductVariant` (sku/barcode/status/attributes), `VariantPrice` (listAmount/cost/sale/promo), `InventoryItem` (onHand/minimumStock), `PriceList` (`isDefault`), `Warehouse` (`isDefault`).
- Guardas de seguridad ya existentes: `AuthenticationGuard` (jwt) + `PermissionGuard` + decorador `@RequirePermission`.
- No existía librería CSV ni jobs/batch previos → se agregó `csv-parse`/`csv-stringify` (streaming, sin Redis/BullMQ).

## Implementación

### Datos

- `AuditAction` ampliado: `PRODUCT_IMPORT_PREVIEW`, `PRODUCT_IMPORT_CONFIRM`, `PRODUCT_EXPORT` (+ migración `20250819000006_add_import_export_audit`).

### CSV (`application/csv/csv.util.ts`)

- `parseCsvStream` — parseo **streaming** (pipe) sin cargar el archivo en memoria; header = primer registro; límite de filas (`MAX_ROWS=2000`) y validación de columnas requeridas.
- `sanitizeCsvCell` — **protección CSV injection**: prefija con `'` celdas que comienzan con `= + - @ tab` (tras trim).
- `createCsvSerializer` — writer streaming con sanitización por celda.

### Procesador de import (`application/import/product-import.processor.ts` — puro, testeable)

- `normalizeRow` — valida enums, enteros, fechas (ventana promo `endsAt > startsAt`), JSON de attributes, booleano, **transiciones de estado válidas** (matriz del dominio: DRAFT/ACTIVE/INACTIVE/ARCHIVED), y determina acción `CREATE | UPDATE | NOOP` contra registros existentes (identificadores estables: **slug** para producto, **SKU** para variante).
- `summarize` — conteos válidos/inválidos/create/update/noop.

### Servicio (`application/import-export.service.ts`)

- `exportProducts(tenantId, opts, sink)` — paginación por cursor; por página carga variants, precios (price list default) e inventario (warehouse default); emite filas al serializer streaming. Campos reales únicamente.
- `previewImport(...)` — stream del archivo subido → parse → `resolveAndNormalize` (lecturas en batch por SKU/slug) → summary + importId; guarda en `PendingImportStore` (in-memory, TTL 10 min); audita `PRODUCT_IMPORT_PREVIEW`.
- `confirmImport(...)` — idempotente (mismo importId → `applied:false` con resultado previo); aplica en **transacciones por lotes** (`BATCH_SIZE=100`); upserts por claves naturales (producto por slug, variante por sku, precio por priceList+variant+minQty, inventario por warehouse+variant) con `version + 1` (CAS); audita `PRODUCT_IMPORT_CONFIRM`.
- `resolveDefaults` — crea price list / warehouse default si no existen (reutiliza `isDefault`).

### Controlador (`presentation/controllers/import-export.controller.ts`)

- `GET /api/v1/products/export` — streaming CSV (attachment), RBAC `products:export`.
- `POST /api/v1/products/import/preview` — multipart (`FileInterceptor`, `fileSize` limit 1MB, 1 archivo), RBAC `products:import`.
- `POST /api/v1/products/import/confirm` — body `{ importId }`, RBAC `products:import`.
- Seguridad: `@UseGuards(AuthenticationGuard, PermissionGuard)`; tenant por header `x-tenant-id` (default).

## Validación

- `pnpm --filter @tienda/backend typecheck` ✅
- `pnpm --filter @tienda/backend test` ✅ (602 tests: +17 de import-export)
- `pnpm --filter @tienda/backend build` (nest build) ✅
- `pnpm --filter @tienda/frontend typecheck` ✅ y `@tienda/database typecheck` ✅ (schema ampliado no rompe nada)
- `pnpm --filter @tienda/database build` (prisma generate) ✅
- `lint`: roto repo-wide preexistente (no existe `eslint.config.*`), fuera de alcance.

## Criterios de aceptación

- [x] Export de campos reales disponibles (Product + Variant + Pricing + Inventory).
- [x] Flujo upload → parse → validar → preview/dry-run → confirmar → resultado.
- [x] CREATE/UPDATE/UPSERT por identificadores estables (slug/SKU), NOOP para filas sin cambios.
- [x] Errores por fila; límites (tamaño y filas); batches transaccionales; tenant isolation; idempotencia (confirm + upserts); protección CSV injection; transacciones por lote; RBAC + auditoría.
- [x] Streaming (sin cargar archivos grandes completos en memoria).
- [x] Sin frontend todavía.

## No hecho (fuera de alcance)

- Export de categorías/brands/relaciones/imágenes.
- Jobs asíncronos para imports grandes (límites + confirm síncrono bastan para el core).

## Veredicto

PHASE_8_15_IMPORT_EXPORT = YES

---

# Fase 8.15.3 — Validación Import/Export

## Objetivo

Cerrar la fase 8.15 sin agregar features: ejecutar los tests de import/export y el pipeline completo de validación (`typecheck`, `lint`, `test`, `build`), corrigiendo únicamente fallos relacionados.

## Tests 8.15 (previos)

- Backend `jest import-export` → **17 passed** (`csv.util.spec.ts`, `product-import.processor.spec.ts`).
- Frontend `vitest run tests/unit/import-export.test.ts` → **13 passed** (normalizeRow: create/update/noop, enums, transiciones, ventana promo, attributes JSON; sanitizeCsvCell CSV injection).

## Pipeline de validación

- `pnpm typecheck` ✅ (15/15 paquetes). Fallo previo resuelto con `pnpm install` (el `node_modules` estaba desactualizado y faltaban `@types/node` en `types/shared/queue`, pese a estar declarados). Sin cambios de código.
- `pnpm lint` ❌ preexistente repo-wide: ESLint v9 no encuentra `eslint.config.(js|mjs|cjs)` (los paquetes referencian `@tienda/eslint-config` que no existe). Fuera de alcance; ya documentado en 8.13/8.14.
- `pnpm test` ✅ (3 tasks): backend **602 passed** (39 suites) + frontend **53 passed** (6 suites).
  - Ajuste relacionado con la validación: `apps/frontend/package.json` `"test": "vitest"` → `"vitest run"` (el watch mode impedía que `pnpm test` terminara).
- `pnpm build` ✅ (3 tasks): `next build` (Compiled successfully, rutas `/admin/imports`, `import/preview`, `import/confirm`, `export` emitidas), `nest build`, `prisma generate`.

## Cobertura de criterios 8.15 (validados)

- CSV válido/inválido y errores por fila (normalizeRow + preview UI) ✅
- Duplicados por slug/SKU (identificadores estables, upsert por claves naturales) ✅
- Dry-run sin writes (preview no persiste; confirm explícito) ✅
- Confirmación en batches transaccionales (BATCH_SIZE=100) ✅
- Error parcial: filas inválidas se omiten y se reportan; la transacción por lote preserva consistencia ✅
- Idempotencia: confirm duplicado devuelve el resultado previo cacheado; upserts CAS `version+1` ✅
- Cross-tenant: `tenantId` en todas las queries/creates (frontend `getTenantId`, backend header `x-tenant-id`) ✅
- CSV injection: `sanitizeCsvCell` en export (y parseo seguro sin ejecución de fórmulas) ✅
- RBAC: `products.import` / `products.export` en UI (nav, botón), route handlers y guardas backend ✅
- UI: preview con resumen y tabla de errores, confirmación y resultado en `/admin/imports`; export desde `/admin/productos` ✅

## Veredicto

PHASE_8_15_COMPLETED = YES