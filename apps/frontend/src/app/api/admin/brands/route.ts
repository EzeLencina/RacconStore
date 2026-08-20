import { NextResponse } from 'next/server';
import { getCurrentSession } from '@lib/auth';
import { can, PERMISSIONS } from '@lib/auth/rbac';
import { getTenantId } from '@lib/auth/tenant';
import { listBrands, createBrand, CatalogCrudError, type BrandInput } from '@lib/catalog/catalog';

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
    const result = await listBrands(
      getTenantId(),
      {
        q: url.searchParams.get('q') ?? undefined,
        status: url.searchParams.get('status') ?? undefined,
        page,
        pageSize,
      },
    );
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof CatalogCrudError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: 'Error al listar marcas' }, { status: 500 });
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

  let body: BrandInput;
  try {
    body = (await request.json()) as BrandInput;
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  try {
    const result = await createBrand(getTenantId(), body);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof CatalogCrudError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: 'Error al crear la marca' }, { status: 500 });
  }
}