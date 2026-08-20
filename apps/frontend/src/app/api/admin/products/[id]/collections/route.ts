import { NextResponse } from 'next/server';
import { getCurrentSession } from '@lib/auth';
import { can, PERMISSIONS } from '@lib/auth/rbac';
import { getTenantId } from '@lib/auth/tenant';
import { setProductCollections, ProductCrudError } from '@lib/products/crud';

type RouteContext = { params: Promise<{ id: string }> };

export async function PUT(request: Request, { params }: RouteContext) {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }
  if (!can(session.roles, session.permissions, PERMISSIONS.PRODUCTS_MANAGE)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const { id } = await params;

  let body: { collectionIds: string[] };
  try {
    body = (await request.json()) as { collectionIds: string[] };
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }
  if (!Array.isArray(body.collectionIds)) {
    return NextResponse.json({ error: 'collectionIds requerido' }, { status: 400 });
  }

  try {
    await setProductCollections(getTenantId(), { id: session.id, email: session.email }, id, body.collectionIds);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof ProductCrudError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: 'Error al asignar colecciones' }, { status: 500 });
  }
}