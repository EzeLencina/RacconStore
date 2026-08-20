import { cookies } from 'next/headers';
import { randomBytes } from 'node:crypto';
import { prisma } from './prisma';
import { getTenantId } from './tenant';
import { ROLES, ROLE_PERMISSIONS, type RoleCode } from './rbac';

export const SESSION_COOKIE = 'tienda_session';
export const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60;

export type SessionUser = {
  id: string;
  tenantId: string;
  email: string;
  name: string | null;
  roles: RoleCode[];
  permissions: string[];
};

export async function createSession(userId: string): Promise<string> {
  const token = randomBytes(32).toString('base64url');

  await prisma.session.create({
    data: {
      id: token,
      tenantId: getTenantId(),
      userId,
      expiresAt: new Date(Date.now() + SESSION_TTL_MS),
    },
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
  });

  return token;
}

export async function getSessionToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE)?.value ?? null;
}

export async function getSessionUserId(): Promise<string | null> {
  const token = await getSessionToken();
  if (!token) {
    return null;
  }

  const session = await prisma.session.findUnique({ where: { id: token } });
  if (!session) {
    return null;
  }

  if (session.tenantId !== getTenantId()) {
    return null;
  }

  if (session.revokedAt || session.expiresAt <= new Date()) {
    return null;
  }

  return session.userId;
}

export async function getUserRoles(userId: string): Promise<RoleCode[]> {
  const rows = await prisma.userRole.findMany({
    where: { tenantId: getTenantId(), userId },
    include: { role: true },
  });

  return rows.map((row) => row.role.name);
}

export async function getUserPermissions(userId: string, roles: string[]): Promise<string[]> {
  if (roles.includes(ROLES.ADMIN)) {
    return [...ROLE_PERMISSIONS.ADMIN];
  }

  const rows = await prisma.userRole.findMany({
    where: { tenantId: getTenantId(), userId },
    include: {
      role: {
        include: { permissions: { include: { permission: true } } },
      },
    },
  });

  const codes = new Set<string>();
  for (const row of rows) {
    for (const assignment of row.role.permissions) {
      codes.add(assignment.permission.code);
    }
  }

  return [...codes];
}

export async function getCurrentSession(): Promise<SessionUser | null> {
  const userId = await getSessionUserId();
  if (!userId) {
    return null;
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.status !== 'ACTIVE' || user.deletedAt || user.tenantId !== getTenantId()) {
    return null;
  }

  const roles = await getUserRoles(user.id);
  const permissions = await getUserPermissions(user.id, roles);

  return {
    id: user.id,
    tenantId: user.tenantId,
    email: user.email,
    name: user.name,
    roles,
    permissions,
  };
}

export async function destroySession(): Promise<void> {
  const token = await getSessionToken();
  if (token) {
    await prisma.session.deleteMany({ where: { id: token } });
  }

  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}