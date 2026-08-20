import { NextResponse } from 'next/server';
import { getCurrentSession } from '@lib/auth';
import { can, PERMISSIONS } from '@lib/auth/rbac';
import { getTenantId } from '@lib/auth/tenant';
import {
  getProductLifecycle,
  transitionProductStatus,
  LifecycleError,
  type ProductStatusValue,
} from '@lib/products/lifecycle';

type RouteContext = { params: Promise<{ id: string }> };

async function getAuthorizedActor(forPublish: boolean) {
  const session = await getCurrentSession();
  if (!session) {
    return { response: NextResponse.json({ error: 'No autenticado' }, { status: 401 }) };
  }
  const required = forPublish ? PERMISSIONS.PRODUCTS_PUBLISH : PERMISSIONS.PRODUCTS_MANAGE;
  if (!can(session.roles, session.permissions, required)) {
    return { response: NextResponse.json({ error: 'No autorizado' }, { status: 403 }) };
  }
  return { session };
}

export async function GET(_request: Request, { params }: RouteContext) {
  const auth = await getAuthorizedActor(false);
  if (auth.response) return auth.response;

  const { id } = await params;
  try {
    const lifecycle = await getProductLifecycle(getTenantId(), id);
    return NextResponse.json(lifecycle);
  } catch (error) {
    if (error instanceof LifecycleError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}

export async function POST(request: Request, { params }: RouteContext) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  const { status } = (body ?? {}) as { status?: unknown };
  if (typeof status !== 'string') {
    return NextResponse.json({ error: 'status requerido' }, { status: 400 });
  }

  const auth = await getAuthorizedActor(status === 'ACTIVE');
  if (auth.response) return auth.response;
  const session = auth.session!;

  const { id } = await params;
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null;
  const userAgent = request.headers.get('user-agent');

  try {
    const result = await transitionProductStatus(
      getTenantId(),
      { id: session.id, email: session.email },
      id,
      status as ProductStatusValue,
      ip,
      userAgent,
    );
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    if (error instanceof LifecycleError) {
      return NextResponse.json(
        { error: error.message, blockers: error.blockers ?? undefined },
        { status: error.status },
      );
    }
    throw error;
  }
}