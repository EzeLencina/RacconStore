import { NextResponse } from 'next/server';
import { getCurrentSession } from '@lib/auth';
import { can, PERMISSIONS } from '@lib/auth/rbac';
import { getTenantId } from '@lib/auth/tenant';
import { listFeaturedAdmin, reorderFeaturedProducts, FeaturedError } from '@lib/products/featured';

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

export async function GET() {
  const auth = await getAuthorizedActor();
  if (auth.response) return auth.response;
  const items = await listFeaturedAdmin(getTenantId());
  return NextResponse.json({ items });
}

export async function PATCH(request: Request) {
  const auth = await getAuthorizedActor();
  if (auth.response) return auth.response;
  const session = auth.session!;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  const { orderedIds } = (body ?? {}) as { orderedIds?: unknown };
  if (!Array.isArray(orderedIds) || !orderedIds.every((id) => typeof id === 'string')) {
    return NextResponse.json({ error: 'Lista de reorden inválida' }, { status: 400 });
  }

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null;
  const userAgent = request.headers.get('user-agent');

  try {
    await reorderFeaturedProducts(
      getTenantId(),
      { id: session.id, email: session.email },
      orderedIds as string[],
      ip,
      userAgent,
    );
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof FeaturedError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}