import { NextResponse } from 'next/server';
import { getCurrentSession } from '@lib/auth';
import { can, PERMISSIONS } from '@lib/auth/rbac';
import { getTenantId } from '@lib/auth/tenant';
import { isProductFeatured, setProductFeatured, FeaturedError } from '@lib/products/featured';

type RouteContext = { params: Promise<{ id: string }> };

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

export async function GET(_request: Request, { params }: RouteContext) {
  const auth = await getAuthorizedActor();
  if (auth.response) return auth.response;

  const { id } = await params;
  const featured = await isProductFeatured(getTenantId(), id);
  return NextResponse.json({ featured });
}

export async function PUT(request: Request, { params }: RouteContext) {
  const auth = await getAuthorizedActor();
  if (auth.response) return auth.response;
  const session = auth.session!;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  const { featured } = (body ?? {}) as { featured?: unknown };
  if (typeof featured !== 'boolean') {
    return NextResponse.json({ error: 'featured debe ser booleano' }, { status: 400 });
  }

  const { id } = await params;
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null;
  const userAgent = request.headers.get('user-agent');

  try {
    await setProductFeatured(
      getTenantId(),
      { id: session.id, email: session.email },
      id,
      featured,
      ip,
      userAgent,
    );
    return NextResponse.json({ ok: true, featured });
  } catch (error) {
    if (error instanceof FeaturedError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}