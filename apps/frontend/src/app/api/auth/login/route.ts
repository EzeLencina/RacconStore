import { NextResponse } from 'next/server';
import { AuditAction } from '@prisma/client';
import { prisma } from '@lib/auth/prisma';
import { getTenantId, verifyPassword, createSession, writeAudit, loginSchema } from '@lib/auth';

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? 'Datos de ingreso inválidos';
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const { email, password } = parsed.data;
  const tenantId = getTenantId();
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null;
  const userAgent = request.headers.get('user-agent');

  const user = await prisma.user.findUnique({
    where: { tenantId_email: { tenantId, email } },
  });

  const invalidCredentials = !user || user.status !== 'ACTIVE' || user.deletedAt;
  const passwordValid = user ? verifyPassword(password, user.passwordHash) : false;

  if (invalidCredentials || !passwordValid) {
    return NextResponse.json({ error: 'Email o contraseña incorrectos' }, { status: 401 });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  await writeAudit({
    action: AuditAction.AUTH_LOGIN,
    actorId: user.id,
    actorEmail: user.email,
    entityType: 'USER',
    entityId: user.id,
    ip,
    userAgent,
  });

  await createSession(user.id);

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
    },
  });
}