import { getTenantId } from '@lib/auth/tenant';
import { listPublicCategories } from '@lib/storefront/catalog';
import { MainLayout } from '@components/layout/main-layout';

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const tenantId = getTenantId();
  const categories = await listPublicCategories(tenantId);

  return (
    <MainLayout categories={categories}>
      {children}
    </MainLayout>
  );
}