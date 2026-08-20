import { NextResponse } from 'next/server';
import { getCurrentSession } from '@lib/auth';
import { can, PERMISSIONS } from '@lib/auth/rbac';
import { getTenantId } from '@lib/auth/tenant';
import { previewImport, ImportExportError } from '@lib/products/import-export';

export async function POST(request: Request) {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }
  if (!can(session.roles, session.permissions, PERMISSIONS.PRODUCTS_IMPORT)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 });
  }

  const file = formData.get('file');
  const mode = (formData.get('mode') as string | null) ?? 'UPSERT';
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Se requiere un archivo CSV' }, { status: 400 });
  }
  if (file.size === 0) {
    return NextResponse.json({ error: 'El archivo está vacío' }, { status: 400 });
  }
  if (file.size > 1024 * 1024) {
    return NextResponse.json({ error: 'El archivo supera el límite de 1MB' }, { status: 400 });
  }

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null;
  const userAgent = request.headers.get('user-agent');

  try {
    const result = await previewImport(
      getTenantId(),
      { id: session.id, email: session.email },
      { stream: () => file.stream() as unknown as NodeJS.ReadableStream },
      mode as 'CREATE' | 'UPDATE' | 'UPSERT',
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