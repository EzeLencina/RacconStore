import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getCurrentSession } from '@lib/auth';
import { AuthCard } from '@components/auth/auth-card';
import { RegisterForm } from '@components/auth/register-form';

export const metadata: Metadata = {
  title: 'Crear cuenta',
  robots: { index: false, follow: false },
};

export default async function RegisterPage() {
  const session = await getCurrentSession();
  if (session) {
    redirect('/');
  }

  return (
    <AuthCard
      title="Crear cuenta"
      description="Registrate para comprar más rápido"
    >
      <RegisterForm />
    </AuthCard>
  );
}