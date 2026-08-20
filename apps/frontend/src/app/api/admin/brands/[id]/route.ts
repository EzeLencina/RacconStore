import { NextResponse } from 'next/server';
import { getCurrentSession } from '@lib/auth';
import { can, PERMISSIONS } from '@lib/auth/rbac';
import { getTenantId } from '@lib/auth/tenant';
import { updateBrand, deleteBrand, CatalogCrudError, type BrandInput } from '@lib/catalog/catalog';

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: RouteContext) {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }
  if (!can(session.roles, session.permissions, PERMISSIONS.PRODUCTS_MANAGE)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const { id } = await params;

  let body: { input: BrandInput; expectedVersion: number };
  try {
    body = (await request.json()) as { input: BrandInput; expectedVersion: number };
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  try {
    const result = await updateBrand(getTenantId(), id, body.input, body.expectedVersion);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof CatalogCrudError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: 'Error al guardar la marca' }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }
  if (!can(session.roles, session.permissions, PERMISSIONS.PRODUCTS_MANAGE)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const { id } = await params;

  try {
    await deleteBrand(getTenantId(), id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof CatalogCrudError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: 'Error al eliminar la marca' }, { status: 500 });
  }
}