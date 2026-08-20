# Fase 8.10.1 — Acceso real al panel admin

## Objetivo

Permitir crear cuenta, iniciar/cerrar sesión y entrar realmente a `/admin` con RBAC usando la autenticación existente. PostgreSQL es la única autoridad de usuarios, roles y permisos.

## Alcance

- `/register` y `/registrarse` → registro de cuenta.
- `/login` e `/ingresar` → inicio de sesión con sesión persistente (cookie httpOnly).
- Logout funcional en panel admin, menú móvil y sidebar de cuenta.
- Protección server-side de `/admin/**` vía middleware + guard `requireAdmin`.
- Dashboard `/admin` con navegación filtrada por permisos.
- Cuenta nueva = rol `CUSTOMER` (nunca `ADMIN` desde frontend).
- Comandos `pnpm admin:promote` / `pnpm admin:demote` con auditoría.
- Auditoría de registro/login/logout/promote/demote en `AuditLog`.

## Piezas verificadas / completadas

### Backend de identidad (frontend, App Router + Prisma)

- `apps/frontend/src/lib/auth/*`
  - `session.ts`: cookie `tienda_session` httpOnly, TTL 7 días, sesión persistente en `sessions`, `getCurrentSession` resuelve user + roles + permisos (tenant-scoped).
  - `password.ts`: hash `scrypt` con salt único, verificación con `timingSafeEqual`.
  - `rbac.ts`: roles `CUSTOMER`/`ADMIN`, permisos `admin.access`…`settings.manage`, `can`/`isAdmin`.
  - `guard.ts`: `requireUser` (redirect a `/ingresar`) y `requireAdmin` (403 vía `forbidden()` para no-ADMIN).
  - `audit.ts`: `writeAudit` en `AuditLog` (tenant-scoped).
  - `schemas.ts`: validación zod para registro/login.
  - `tenant.ts`: `getTenantId()` (aislamiento multi-tenant).
- Rutas API:
  - `app/api/auth/register/route.ts` — valida, crea user, asigna `CUSTOMER` (upsert del rol, `isSystem`), audita `AUTH_REGISTER`, crea sesión. Nunca asigna `ADMIN`.
  - `app/api/auth/login/route.ts` — valida credenciales, `lastLoginAt`, audita `AUTH_LOGIN`, crea sesión.
  - `app/api/auth/logout/route.ts` — audita `AUTH_LOGOUT` y destruye sesión.
  - `app/api/auth/session/route.ts` — devuelve el usuario actual.

### Protección `/admin/**`

- `src/middleware.ts`: redirige a `/ingresar?next=…` si no hay cookie de sesión.
- `app/(admin)/layout.tsx`: `requireAdmin()` server-side + navegación filtrada por permisos.
- `app/(admin)/admin/[[...slug]]/page.tsx`: `requireAdmin()` server-side, dashboard y placeholders de módulos.
- Usuario no autenticado → login; `CUSTOMER` → 403 (`forbidden.ts`).

### RBAC en PostgreSQL

- Schema: `User`, `Role`, `Permission`, `UserRole`, `RolePermission`, `Session`, `AuditLog` (tenant-scoped, unique `[tenantId, email]` / `[tenantId, code]`).
- Seed: 8 permisos + roles `ADMIN`/`CUSTOMER` + asignaciones `ADMIN → permisos`.

### Promote / demote

- `packages/database/prisma/scripts/admin-role.ts` (alias `pnpm admin:promote` / `admin:demote`):
  - Valida existencia de usuario por email dentro del tenant.
  - `promote`: upsert rol `ADMIN` + `UserRole`, audita `ROLE_PROMOTE`.
  - `demote`: deleteMany `UserRole`, audita `ROLE_DEMOTE`.
  - No acepta rol por argumento: siempre `ADMIN`, seguro.

### Fixes en esta fase

- Logout sin efecto en UI de cliente:
  - `components/account/sidebar/account-sidebar.tsx`: botón "Cerrar sesión" ahora ejecuta POST `/api/auth/logout` y redirige.
  - `components/layout/navigation/mobile-menu.tsx`: idem.

## Validación

- `pnpm --filter @tienda/frontend typecheck` ✅
- `pnpm --filter @tienda/frontend exec vitest run` ✅ (11 tests: hash/verify, RBAC `can`/`isAdmin`)
- `pnpm --filter @tienda/database typecheck` ✅
- `pnpm --filter @tienda/database build` (prisma generate) ✅
- `pnpm --filter @tienda/frontend build` ✅ (33 páginas, `/admin` y `/api/auth/*` dinámicos)

## Criterios de aceptación

- [x] Registro/login/logout funcional.
- [x] Cuenta nueva = `CUSTOMER` (el frontend nunca envía roles).
- [x] `CUSTOMER` → `/admin` = 403 (guard server-side).
- [x] `ADMIN` → acceso al dashboard y módulos.
- [x] Navegación admin respeta permisos.
- [x] `pnpm admin:promote` / `admin:demote` funcionan y auditan.
- [x] PostgreSQL como autoridad de usuarios/roles/permisos.
- [x] Aislamiento multi-tenant intacto (todas las queries filtran por `tenantId`).

## No hecho (fuera de alcance)

- Recuperación de contraseña: no existía soporte previo.
- Protección server-side de `/account/**` (módulo cliente, fase separada).
- `auth.service.ts` del frontend queda como stub sin uso (no se introdujo segundo sistema).

## Veredicto

PHASE_8_10_1_COMPLETED = YES