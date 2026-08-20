import { NextResponse } from 'next/server';
import { getCurrentSession } from '@lib/auth';
import { can, PERMISSIONS } from '@lib/auth/rbac';
import { getTenantId } from '@lib/auth/tenant';
import { updateVariant, deleteVariant, ProductCrudError, type VariantInput } from '@lib/products/crud';

type RouteContext = { params: Promise<{ id: string; variantId: string }> };

export async function PATCH(request: Request, { params }: RouteContext) {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }
  if (!can(session.roles, session.permissions, PERMISSIONS.PRODUCTS_MANAGE)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const { id, variantId } = await params;

  let body: { input: VariantInput; expectedVersion: number };
  try {
    body = (await request.json()) as { input: VariantInput; expectedVersion: number };
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  try {
    const result = await updateVariant(
      getTenantId(),
      { id: session.id, email: session.email },
      id,
      variantId,
      body.input,
      body.expectedVersion,
    );
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof ProductCrudError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: 'Error al guardar la variante' }, { status: 500 });
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

  const { id, variantId } = await params;

  try {
    await deleteVariant(getTenantId(), { id: session.id, email: session.email }, id, variantId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof ProductCrudError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: 'Error al eliminar la variante' }, { status: 500 });
  }
}