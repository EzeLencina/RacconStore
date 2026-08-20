import type { Metadata } from 'next';
import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getCurrentSession } from '@lib/auth';
import { AuthCard } from '@components/auth/auth-card';
import { LoginForm } from '@components/auth/login-form';

export const metadata: Metadata = {
  title: 'Iniciar sesión',
  robots: { index: false, follow: false },
};

export default async function LoginPage() {
  const session = await getCurrentSession();
  if (session) {
    redirect('/');
  }

  return (
    <AuthCard
      title="Iniciar sesión"
      description="Ingresá con tu email y contraseña"
    >
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </AuthCard>
  );
}