# Fase 8.15.2 — Import/Export Admin UI

## Objetivo

Conectar el motor de import/export al panel admin de Next.js: página `/admin/imports` (subir CSV → preview/dry-run → errores por fila → confirmar → resultado) y exportación del catálogo desde `/admin/productos`. RBAC con los permisos existentes y componentes/patrones admin reutilizados.

## Inspección previa (reutilizado)

- APIs y motor 8.15.1 (backend NestJS) como referencia lógica; el panel admin de Next.js opera con **Prisma directo** (igual que 8.13/8.14) → se replicó el flujo del motor en route handlers de Next.js sin tocar el backend.
- Patrones admin reutilizados: `requirePermission` + `getCurrentSession` + `can` (guard.ts/rbac.ts), `getTenantId`, `writeAudit`, `Button`/`Badge` de `@tienda/ui`, cliente de fetch con estados busy/error/notice (lifecycle-actions), tabla de listado del admin de productos.
- Navegación: `navigation.config.ts` (admin) + `ICONS` en `admin-shell.tsx` + `NAV_PERMISSION` en `(admin)/layout.tsx`.

## Implementación

### Datos / RBAC

- `PERMISSIONS.PRODUCTS_IMPORT = 'products.import'` y `PERMISSIONS.PRODUCTS_EXPORT = 'products.export'` agregados en `apps/frontend/src/lib/auth/rbac.ts` (+ seed con `products.import` / `products.export`).

### Lógica pura (`lib/products/import-export.types.ts`)

- `sanitizeCsvCell` — protección CSV injection (`'` para celdas que inician con `= + - @ tab`).
- `normalizeRow` — valida sku/slug/name obligatorios, enums, enteros, fechas (ventana promo), attributes JSON, booleano, **transiciones de estado** (matriz del dominio) y determina `CREATE | UPDATE | NOOP` contra existentes (slug para producto, SKU para variante), reutilizando el estado real del producto embebido en la variante.
- `STATUS_TRANSITIONS`, `EXPORT_COLUMNS`, límites (2000 filas, batch 100), tipos de preview/confirm.

### Servicio (`lib/products/import-export.ts`)

- `exportProductsCsv` — paginación por cursor (Product+Variant+VariantPrice+InventoryItem reales, price list/warehouse default), filas sanitizadas, CSV vía `csv-stringify`, auditoría `PRODUCT_EXPORT`.
- `parseCsvStream` + `previewImport` — streaming (`csv-parse` sobre `file.stream()`), header→columnas, límites (1MB/2000 filas), `resolveAndNormalize` (batches por SKU/slug), summary + `importId`, auditoría `PRODUCT_IMPORT_PREVIEW`.
- `confirmImport` — idempotente (resultado previo cacheado), aplica en transacciones por lotes (100), upserts por claves naturales (producto por slug, variante por sku, precio por priceList+variant+minQty, inventario por warehouse+variant) con `version+1`, modos CREATE/UPDATE/UPSERT con filas omitidas reportadas, auditoría `PRODUCT_IMPORT_CONFIRM`.
- Store `lib/products/import-pending.store.ts` — in-memory TTL 10 min + resultados para idempotencia (`globalThis`).

### APIs (route handlers Next.js, RBAC por cookie)

- `GET /api/admin/products/export` — CSV attachment (`products.export`).
- `POST /api/admin/products/import/preview` — multipart (`file`, `mode`) (`products.import`).
- `POST /api/admin/products/import/confirm` — body `{ importId }` (`products.import`).

### UI

- `/admin/imports` (`ImportManager`): selector de archivo CSV, modo (UPSERT/CREATE/UPDATE), preview automático (resumen de filas válidas/inválidas/crear/actualizar/sin cambios + tabla de errores por fila), confirmar con resultado (creados/actualizados/sin cambios/errores). Exportar catálogo también desde el header de la página.
- `/admin/productos`: botón "Exportar CSV" (solo si `can(products.export)`).
- Navegación: ítem "Importar/Exportar" (icono `FileUp`, permiso `products.import`).

## Validación

- `pnpm --filter @tienda/frontend typecheck` (tsc --noEmit) ✅
- `pnpm --filter @tienda/database typecheck` ✅ (seed/rbac no rompen nada)
- `pnpm --filter @tienda/frontend exec vitest run` ✅ (**53 tests**: +13 de import/export)
- `pnpm --filter @tienda/frontend exec next build` ✅ (rutas `import/preview`, `import/confirm`, `export` compilan y emiten)
- `lint`: roto repo-wide preexistente (no existe `eslint.config.*`), fuera de alcance.

## Criterios de aceptación

- [x] Import puede revisarse antes de modificar datos (preview/dry-run con resumen y errores por fila; confirmación explícita).
- [x] Export funciona realmente (CSV con campos reales descargable desde `/admin/productos` y `/admin/imports`).
- [x] RBAC aplicado (`products.import` / `products.export`) en UI (nav, botón) y en cada API.
- [x] Motor backend 8.15.1 sin cambios; UI reutiliza componentes/patrones admin existentes.