import { redirect } from 'next/navigation';

export default async function AdminProductRedirectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/admin/productos/${id}/editar`);
}