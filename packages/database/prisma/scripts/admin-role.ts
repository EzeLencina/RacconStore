import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

const TENANT_ID = process.env.TIENDA_DEFAULT_TENANT_ID ?? process.env.DEFAULT_TENANT_ID ?? 'default';

type CliArgs = {
  action: 'promote' | 'demote';
  email?: string;
};

function parseArgs(argv: string[]): CliArgs {
  const positional = argv.find((a) => a === 'promote' || a === 'demote');
  const emailFlag = argv.indexOf('--email');
  const email = emailFlag >= 0 ? argv[emailFlag + 1] : undefined;

  return { action: (positional as CliArgs['action']) ?? 'promote', email };
}

function usage(): never {
  console.error(`
Usage:
  tsx prisma/scripts/admin-role.ts <promote|demote> --email user@example.com

Examples:
  tsx prisma/scripts/admin-role.ts promote --email admin@example.com
  tsx prisma/scripts/admin-role.ts demote --email admin@example.com
`);
  process.exit(1);
}

async function ensureAdminRole(tenantId: string) {
  return prisma.role.upsert({
    where: { tenantId_code: { tenantId, code: 'ADMIN' } },
    update: {},
    create: { tenantId, name: 'ADMIN', code: 'ADMIN', description: 'Administrador del sistema', isSystem: true },
  });
}

async function writeAudit(tenantId: string, email: string, action: 'ROLE_PROMOTE' | 'ROLE_DEMOTE', metadata: unknown) {
  const actor = await prisma.user.findUnique({ where: { tenantId_email: { tenantId, email } } });
  await prisma.auditLog.create({
    data: {
      tenantId,
      actorId: actor?.id ?? null,
      actorEmail: actor?.email ?? null,
      action,
      entityType: 'USER',
      entityId: actor?.id ?? null,
      metadata: metadata as Prisma.InputJsonValue,
    },
  });
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  if (!args.email) {
    usage();
  }

  const email = args.email.toLowerCase().trim();

  const user = await prisma.user.findUnique({
    where: { tenantId_email: { tenantId: TENANT_ID, email } },
  });

  if (!user) {
    console.error(`User with email "${email}" not found in tenant "${TENANT_ID}".`);
    process.exit(1);
  }

  if (args.action === 'promote') {
    const adminRole = await ensureAdminRole(TENANT_ID);
    await prisma.userRole.upsert({
      where: { tenantId_userId_roleId: { tenantId: TENANT_ID, userId: user.id, roleId: adminRole.id } },
      update: {},
      create: { tenantId: TENANT_ID, userId: user.id, roleId: adminRole.id, assignedBy: 'cli' },
    });
    await writeAudit(TENANT_ID, email, 'ROLE_PROMOTE', { role: 'ADMIN', source: 'cli' });
    console.log(`Promoted ${email} to ADMIN (tenant: ${TENANT_ID}).`);
  } else {
    const adminRole = await prisma.role.findUnique({
      where: { tenantId_code: { tenantId: TENANT_ID, code: 'ADMIN' } },
    });

    if (!adminRole) {
      console.log(`No ADMIN role exists for tenant "${TENANT_ID}". Nothing to do.`);
      process.exit(0);
    }

    const result = await prisma.userRole.deleteMany({
      where: { tenantId: TENANT_ID, userId: user.id, roleId: adminRole.id },
    });

    if (result.count === 0) {
      console.log(`${email} is not an ADMIN in tenant "${TENANT_ID}". Nothing to do.`);
      process.exit(0);
    }

    await writeAudit(TENANT_ID, email, 'ROLE_DEMOTE', { role: 'ADMIN', source: 'cli' });
    console.log(`Demoted ${email} from ADMIN (tenant: ${TENANT_ID}).`);
  }
}

main()
  .catch((e) => {
    console.error('admin-role failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });