import { NextResponse } from 'next/server';
import { getCurrentSession } from '@lib/auth';
import { can, PERMISSIONS } from '@lib/auth/rbac';
import { getTenantId } from '@lib/auth/tenant';
import { listProducts, createProduct, ProductCrudError, type ProductInput } from '@lib/products/crud';

const MAX_PAGE_SIZE = 50;

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
  const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, Number(url.searchParams.get('pageSize')) || 20));

  try {
    const result = await listProducts(
      getTenantId(),
      {
        q: url.searchParams.get('q') ?? undefined,
        status: url.searchParams.get('status') ?? undefined,
        productType: url.searchParams.get('productType') ?? undefined,
        brandId: url.searchParams.get('brandId') ?? undefined,
        categoryId: url.searchParams.get('categoryId') ?? undefined,
      },
      page,
      pageSize,
    );
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof ProductCrudError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: 'Error al listar productos' }, { status: 500 });
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

  let body: ProductInput;
  try {
    body = (await request.json()) as ProductInput;
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  try {
    const result = await createProduct(getTenantId(), { id: session.id, email: session.email }, body);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof ProductCrudError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: 'Error al crear el producto' }, { status: 500 });
  }
}