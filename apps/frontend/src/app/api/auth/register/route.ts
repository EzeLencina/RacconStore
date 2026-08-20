import { NextResponse } from 'next/server';
import { AuditAction } from '@prisma/client';
import { prisma } from '@lib/auth/prisma';
import { getTenantId, hashPassword, createSession, writeAudit, registerSchema, ROLES } from '@lib/auth';

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? 'Datos de registro inválidos';
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const { name, email, password } = parsed.data;
  const tenantId = getTenantId();
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null;
  const userAgent = request.headers.get('user-agent');

  const existing = await prisma.user.findUnique({
    where: { tenantId_email: { tenantId, email } },
  });

  if (existing) {
    return NextResponse.json({ error: 'El email ya está registrado' }, { status: 409 });
  }

  const user = await prisma.user.create({
    data: {
      tenantId,
      email,
      name,
      passwordHash: hashPassword(password),
    },
  });

  const customerRole = await prisma.role.upsert({
    where: { tenantId_code: { tenantId, code: ROLES.CUSTOMER } },
    update: {},
    create: {
      tenantId,
      name: ROLES.CUSTOMER,
      code: ROLES.CUSTOMER,
      description: 'Cliente de la tienda',
      isSystem: true,
    },
  });

  await prisma.userRole.create({
    data: { tenantId, userId: user.id, roleId: customerRole.id },
  });

  await writeAudit({
    action: AuditAction.AUTH_REGISTER,
    actorId: user.id,
    actorEmail: user.email,
    entityType: 'USER',
    entityId: user.id,
    metadata: { role: ROLES.CUSTOMER },
    ip,
    userAgent,
  });

  await createSession(user.id);

  return NextResponse.json(
    {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        roles: [ROLES.CUSTOMER],
      },
    },
    { status: 201 },
  );
}