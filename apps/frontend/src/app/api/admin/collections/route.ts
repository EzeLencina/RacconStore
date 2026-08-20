import { NextResponse } from 'next/server';
import { getCurrentSession } from '@lib/auth';
import { can, PERMISSIONS } from '@lib/auth/rbac';
import { getTenantId } from '@lib/auth/tenant';
import { listCollections, createCollection, CatalogCrudError, type CollectionInput } from '@lib/catalog/catalog';

export async function GET(request: Request) {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }
  if (!can(session.roles, session.permissions, PERMISSIONS.PRODUCTS_MANAGE)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const url = new URL(request.url);
  const page = Math.max(1, Number(url.searchParams.get('page')) || 1);
  const pageSize = Math.min(50, Math.max(1, Number(url.searchParams.get('pageSize')) || 20));

  try {
    const result = await listCollections(
      getTenantId(),
      {
        q: url.searchParams.get('q') ?? undefined,
        status: url.searchParams.get('status') ?? undefined,
        type: url.searchParams.get('type') ?? undefined,
        page,
        pageSize,
      },
    );
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof CatalogCrudError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: 'Error al listar colecciones' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }
  if (!can(session.roles, session.permissions, PERMISSIONS.PRODUCTS_MANAGE)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  let body: CollectionInput;
  try {
    body = (await request.json()) as CollectionInput;
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  try {
    const result = await createCollection(getTenantId(), body);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof CatalogCrudError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: 'Error al crear la colección' }, { status: 500 });
  }
}