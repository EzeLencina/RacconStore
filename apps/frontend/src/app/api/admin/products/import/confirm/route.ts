import { NextResponse } from 'next/server';
import { getCurrentSession } from '@lib/auth';
import { can, PERMISSIONS } from '@lib/auth/rbac';
import { getTenantId } from '@lib/auth/tenant';
import { confirmImport, ImportExportError } from '@lib/products/import-export';

export async function POST(request: Request) {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }
  if (!can(session.roles, session.permissions, PERMISSIONS.PRODUCTS_IMPORT)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  const importId = ((body as { importId?: unknown }) ?? {}).importId;
  if (typeof importId !== 'string' || importId.length === 0) {
    return NextResponse.json({ error: 'importId requerido' }, { status: 400 });
  }

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null;
  const userAgent = request.headers.get('user-agent');

  try {
    const result = await confirmImport(
      getTenantId(),
      { id: session.id, email: session.email },
      importId,
      ip,
      userAgent,
    );
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof ImportExportError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}