import { redirect, forbidden } from 'next/navigation';
import { getCurrentSession, type SessionUser } from './session';
import { ROLES, can, type PermissionCode } from './rbac';

export async function requireUser(): Promise<SessionUser> {
  const session = await getCurrentSession();
  if (!session) {
    redirect('/ingresar');
  }
  return session;
}

export async function requireAdmin(): Promise<SessionUser> {
  const session = await getCurrentSession();
  if (!session) {
    redirect('/ingresar');
  }
  if (!session.roles.includes(ROLES.ADMIN)) {
    forbidden();
  }
  return session;
}

export async function requirePermission(permission: PermissionCode): Promise<SessionUser> {
  const session = await getCurrentSession();
  if (!session) {
    redirect('/ingresar');
  }
  if (!can(session.roles, session.permissions, permission)) {
    forbidden();
  }
  return session;
}