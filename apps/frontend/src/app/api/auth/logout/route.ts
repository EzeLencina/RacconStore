import { NextResponse } from 'next/server';
import { AuditAction } from '@prisma/client';
import { getCurrentSession, destroySession, writeAudit } from '@lib/auth';

export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null;
  const userAgent = request.headers.get('user-agent');

  const session = await getCurrentSession();
  if (session) {
    await writeAudit({
      action: AuditAction.AUTH_LOGOUT,
      actorId: session.id,
      actorEmail: session.email,
      entityType: 'USER',
      entityId: session.id,
      ip,
      userAgent,
    });
  }

  await destroySession();

  return NextResponse.json({ ok: true });
}