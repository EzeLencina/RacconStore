import { NextResponse } from 'next/server';
import { getCurrentSession } from '@lib/auth';
import { can, PERMISSIONS } from '@lib/auth/rbac';
import { getTenantId } from '@lib/auth/tenant';
import {
  getProductLifecycle,
  scheduleProductPublication,
  cancelProductSchedule,
  LifecycleError,
} from '@lib/products/lifecycle';

type RouteContext = { params: Promise<{ id: string }> };

async function getAuthorizedActor(forWrite: boolean) {
  const session = await getCurrentSession();
  if (!session) {
    return { response: NextResponse.json({ error: 'No autenticado' }, { status: 401 }) };
  }
  const required = forWrite ? PERMISSIONS.PRODUCTS_PUBLISH : PERMISSIONS.PRODUCTS_MANAGE;
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

export async function PUT(request: Request, { params }: RouteContext) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  const { publishAt, unpublishAt } = (body ?? {}) as {
    publishAt?: string | null;
    unpublishAt?: string | null;
  };
  const parseDate = (value: string | null | undefined) =>
    typeof value === 'string' && value.length > 0 ? new Date(value) : null;
  const parsedPublish = parseDate(publishAt);
  const parsedUnpublish = parseDate(unpublishAt);
  if (
    (publishAt !== undefined && parsedPublish === null && typeof publishAt === 'string') ||
    (unpublishAt !== undefined && parsedUnpublish === null && typeof unpublishAt === 'string')
  ) {
    return NextResponse.json({ error: 'Formato de fecha inválido' }, { status: 400 });
  }

  const auth = await getAuthorizedActor(true);
  if (auth.response) return auth.response;
  const session = auth.session!;

  const { id } = await params;
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null;
  const userAgent = request.headers.get('user-agent');

  try {
    const result = await scheduleProductPublication(
      getTenantId(),
      { id: session.id, email: session.email },
      id,
      parsedPublish,
      parsedUnpublish,
      ip,
      userAgent,
    );
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    if (error instanceof LifecycleError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const auth = await getAuthorizedActor(true);
  if (auth.response) return auth.response;
  const session = auth.session!;

  const { id } = await params;

  try {
    const result = await cancelProductSchedule(
      getTenantId(),
      { id: session.id, email: session.email },
      id,
    );
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    if (error instanceof LifecycleError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}