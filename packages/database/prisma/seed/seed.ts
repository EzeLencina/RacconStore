import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const TENANT_ID = process.env.TIENDA_DEFAULT_TENANT_ID ?? process.env.DEFAULT_TENANT_ID ?? 'default';

const PERMISSIONS = [
  { code: 'admin.access', resource: 'admin', action: 'access' },
  { code: 'admin.dashboard.view', resource: 'admin', action: 'view' },
  { code: 'products.manage', resource: 'products', action: 'manage' },
  { code: 'products.publish', resource: 'products', action: 'publish' },
  { code: 'products.import', resource: 'products', action: 'import' },
  { code: 'products.export', resource: 'products', action: 'export' },
  { code: 'inventory.manage', resource: 'inventory', action: 'manage' },
  { code: 'orders.manage', resource: 'orders', action: 'manage' },
  { code: 'customers.manage', resource: 'customers', action: 'manage' },
  { code: 'finance.view', resource: 'finance', action: 'view' },
  { code: 'settings.manage', resource: 'settings', action: 'manage' },
] as const;

async function main(): Promise<void> {
  const permissionIds: string[] = [];

  for (const permission of PERMISSIONS) {
    const [resource, action] = permission.code.split('.');
    const row = await prisma.permission.upsert({
      where: { tenantId_code: { tenantId: TENANT_ID, code: permission.code } },
      update: { resource, action, description: `${resource}:${action}` },
      create: {
        tenantId: TENANT_ID,
        code: permission.code,
        resource,
        action,
        description: `${resource}:${action}`,
      },
    });
    permissionIds.push(row.id);
  }

  const adminRole = await prisma.role.upsert({
    where: { tenantId_code: { tenantId: TENANT_ID, code: 'ADMIN' } },
    update: {},
    create: {
      tenantId: TENANT_ID,
      name: 'ADMIN',
      code: 'ADMIN',
      description: 'Administrador del sistema',
      isSystem: true,
    },
  });

  const customerRole = await prisma.role.upsert({
    where: { tenantId_code: { tenantId: TENANT_ID, code: 'CUSTOMER' } },
    update: {},
    create: {
      tenantId: TENANT_ID,
      name: 'CUSTOMER',
      code: 'CUSTOMER',
      description: 'Cliente de la tienda',
      isSystem: true,
    },
  });

  for (const permissionId of permissionIds) {
    await prisma.rolePermission.upsert({
      where: {
        tenantId_roleId_permissionId: {
          tenantId: TENANT_ID,
          roleId: adminRole.id,
          permissionId,
        },
      },
      update: {},
      create: { tenantId: TENANT_ID, roleId: adminRole.id, permissionId },
    });
  }

  const products = [
    {
      slug: 'cerradura-inteligente-yale-yrd256',
      name: 'Cerradura Inteligente Yale YRD256 WiFi',
    },
    {
      slug: 'cerradura-inteligente-samsung-sph-p72',
      name: 'Cerradura Inteligente Samsung SHP-P72',
    },
    {
      slug: 'camara-ip-ezviz-c8c-pro-4k',
      name: 'Cámara IP EZVIZ C8C Pro 4K',
    },
  ];

  const productIds = new Map<string, string>();
  for (const product of products) {
    const row = await prisma.product.upsert({
      where: { tenantId_slug: { tenantId: TENANT_ID, slug: product.slug } },
      update: { name: product.name, status: 'ACTIVE', visibility: 'PUBLIC' },
      create: {
        tenantId: TENANT_ID,
        name: product.name,
        slug: product.slug,
        status: 'ACTIVE',
        visibility: 'PUBLIC',
      },
    });
    productIds.set(product.slug, row.id);
  }

  const relations: { source: string; target: string; type: 'RELATED' | 'ALTERNATIVE' | 'COMPLEMENTARY' }[] = [
    { source: 'cerradura-inteligente-yale-yrd256', target: 'cerradura-inteligente-samsung-sph-p72', type: 'RELATED' },
    { source: 'cerradura-inteligente-yale-yrd256', target: 'camara-ip-ezviz-c8c-pro-4k', type: 'COMPLEMENTARY' },
    { source: 'cerradura-inteligente-samsung-sph-p72', target: 'cerradura-inteligente-yale-yrd256', type: 'RELATED' },
    { source: 'camara-ip-ezviz-c8c-pro-4k', target: 'cerradura-inteligente-yale-yrd256', type: 'COMPLEMENTARY' },
  ];

  for (const relation of relations) {
    const sourceId = productIds.get(relation.source);
    const targetId = productIds.get(relation.target);
    if (!sourceId || !targetId) continue;

    const [position, existing] = await Promise.all([
      prisma.productRelation.count({
        where: { tenantId: TENANT_ID, sourceProductId: sourceId, type: relation.type },
      }),
      prisma.productRelation.findUnique({
        where: {
          tenantId_sourceProductId_targetProductId_type: {
            tenantId: TENANT_ID,
            sourceProductId: sourceId,
            targetProductId: targetId,
            type: relation.type,
          },
        },
      }),
    ]);

    if (!existing) {
      await prisma.productRelation.create({
        data: {
          tenantId: TENANT_ID,
          sourceProductId: sourceId,
          targetProductId: targetId,
          type: relation.type,
          position,
        },
      });
    }
  }

  const featuredCollection = await prisma.collection.upsert({
    where: { tenantId_slug: { tenantId: TENANT_ID, slug: 'destacados' } },
    update: { type: 'FEATURED', status: 'ACTIVE', visibility: 'PUBLIC' },
    create: {
      tenantId: TENANT_ID,
      name: 'Destacados',
      slug: 'destacados',
      type: 'FEATURED',
      status: 'ACTIVE',
      visibility: 'PUBLIC',
    },
  });

  const featuredSlugs = [
    'cerradura-inteligente-yale-yrd256',
    'camara-ip-ezviz-c8c-pro-4k',
  ];
  for (let index = 0; index < featuredSlugs.length; index++) {
    const productId = productIds.get(featuredSlugs[index]);
    if (!productId) continue;
    await prisma.productCollection.upsert({
      where: {
        tenantId_productId_collectionId: {
          tenantId: TENANT_ID,
          productId,
          collectionId: featuredCollection.id,
        },
      },
      update: {},
      create: {
        tenantId: TENANT_ID,
        productId,
        collectionId: featuredCollection.id,
        displayOrder: index,
      },
    });
  }

  console.log(
    `Seeded ${permissionIds.length} permissions, system roles (ADMIN, CUSTOMER), ${products.length} products, ${relations.length} product relations and ${featuredSlugs.length} featured products for tenant "${TENANT_ID}".`,
  );
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });