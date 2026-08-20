import { NextResponse } from 'next/server';
import { getCurrentSession } from '@lib/auth';
import { can, PERMISSIONS } from '@lib/auth/rbac';
import { getTenantId } from '@lib/auth/tenant';
import { listVariantAttributeKeys } from '@lib/catalog/catalog';

export async function GET() {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }
  if (!can(session.roles, session.permissions, PERMISSIONS.PRODUCTS_MANAGE)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  try {
    const keys = await listVariantAttributeKeys(getTenantId());
    return NextResponse.json({ items: keys });
  } catch {
    return NextResponse.json({ error: 'Error al listar atributos' }, { status: 500 });
  }
}