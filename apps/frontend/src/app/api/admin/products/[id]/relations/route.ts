import { NextResponse } from 'next/server';
import { getCurrentSession } from '@lib/auth';
import { can, PERMISSIONS } from '@lib/auth/rbac';
import { getTenantId } from '@lib/auth/tenant';
import {
  listProductRelations,
  addProductRelation,
  removeProductRelation,
  reorderProductRelations,
  ProductRelationError,
  type ProductRelationTypeValue,
} from '@lib/products/relations';

const RELATION_TYPES: ProductRelationTypeValue[] = ['RELATED', 'ALTERNATIVE', 'COMPLEMENTARY'];

async function getAuthorizedActor() {
  const session = await getCurrentSession();
  if (!session) {
    return { response: NextResponse.json({ error: 'No autenticado' }, { status: 401 }) };
  }
  if (!can(session.roles, session.permissions, PERMISSIONS.PRODUCTS_MANAGE)) {
    return { response: NextResponse.json({ error: 'No autorizado' }, { status: 403 }) };
  }
  return { session };
}

function requestMeta(request: Request) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null;
  const userAgent = request.headers.get('user-agent');
  return { ip, userAgent };
}

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: RouteContext) {
  const auth = await getAuthorizedActor();
  if (auth.response) return auth.response;

  const { id } = await params;
  const tenantId = getTenantId();
  const groups = await listProductRelations(tenantId, id);
  return NextResponse.json({ groups });
}

export async function POST(request: Request, { params }: RouteContext) {
  const auth = await getAuthorizedActor();
  if (auth.response) return auth.response;
  const session = auth.session!;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  const { targetProductId, type } = (body ?? {}) as {
    targetProductId?: unknown;
    type?: unknown;
  };

  if (typeof targetProductId !== 'string' || !targetProductId) {
    return NextResponse.json({ error: 'Producto de destino requerido' }, { status: 400 });
  }
  if (typeof type !== 'string' || !RELATION_TYPES.includes(type as ProductRelationTypeValue)) {
    return NextResponse.json({ error: 'Tipo de relación inválido' }, { status: 400 });
  }

  const { id } = await params;
  const { ip, userAgent } = requestMeta(request);

  try {
    const item = await addProductRelation(
      getTenantId(),
      { id: session.id, email: session.email },
      id,
      targetProductId,
      type as ProductRelationTypeValue,
      ip,
      userAgent,
    );
    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    if (error instanceof ProductRelationError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const auth = await getAuthorizedActor();
  if (auth.response) return auth.response;
  const session = auth.session!;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  const { type, orderedIds } = (body ?? {}) as {
    type?: unknown;
    orderedIds?: unknown;
  };

  if (typeof type !== 'string' || !RELATION_TYPES.includes(type as ProductRelationTypeValue)) {
    return NextResponse.json({ error: 'Tipo de relación inválido' }, { status: 400 });
  }
  if (!Array.isArray(orderedIds) || !orderedIds.every((id) => typeof id === 'string')) {
    return NextResponse.json({ error: 'Lista de reorden inválida' }, { status: 400 });
  }

  const { id } = await params;
  const { ip, userAgent } = requestMeta(request);

  try {
    await reorderProductRelations(
      getTenantId(),
      { id: session.id, email: session.email },
      id,
      type as ProductRelationTypeValue,
      orderedIds as string[],
      ip,
      userAgent,
    );
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof ProductRelationError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}

export async function DELETE(request: Request, { params }: RouteContext) {
  const auth = await getAuthorizedActor();
  if (auth.response) return auth.response;
  const session = auth.session!;

  const { id } = await params;
  const relationId = new URL(request.url).searchParams.get('relationId');
  if (!relationId) {
    return NextResponse.json({ error: 'relationId requerido' }, { status: 400 });
  }

  const { ip, userAgent } = requestMeta(request);

  try {
    await removeProductRelation(getTenantId(), { id: session.id, email: session.email }, id, relationId, ip, userAgent);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof ProductRelationError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}