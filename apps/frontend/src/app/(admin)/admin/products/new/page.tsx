import { redirect } from 'next/navigation';

export default function AdminNewProductRedirectPage() {
  redirect('/admin/productos/nuevo');
}