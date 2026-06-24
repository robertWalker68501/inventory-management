import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient } from '@/app/generated/prisma/client';

const globalForPrisma = global as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
  });

  return new PrismaClient({
    adapter,
  });
}

function getPrismaClient() {
  const cached = globalForPrisma.prisma;

  // Recreate when the dev server kept a client generated before a schema change.
  if (cached && 'tenantInvitation' in cached) {
    return cached;
  }

  const client = createPrismaClient();

  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = client;
  }

  return client;
}

const prisma = getPrismaClient();

export default prisma;
