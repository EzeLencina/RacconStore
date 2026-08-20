import { NextResponse } from 'next/server';
import { getCurrentSession } from '@lib/auth';
import { can, PERMISSIONS } from '@lib/auth/rbac';
import { getTenantId } from '@lib/auth/tenant';
import { exportProductsCsv, ImportExportError } from '@lib/products/import-export';

export async function GET(request: Request) {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }
  if (!can(session.roles, session.permissions, PERMISSIONS.PRODUCTS_EXPORT)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null;
  const userAgent = request.headers.get('user-agent');

  try {
    const { csv, count } = await exportProductsCsv(
      getTenantId(),
      { id: session.id, email: session.email },
      ip,
      userAgent,
    );
    return new Response(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="productos-${new Date().toISOString().slice(0, 10)}.csv"`,
        'X-Export-Count': String(count),
      },
    });
  } catch (error) {
    if (error instanceof ImportExportError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}