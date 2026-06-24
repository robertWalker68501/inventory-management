import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { nextCookies } from 'better-auth/next-js';

import prisma from './prisma';

async function resolveActiveTenantId(
  userId: string,
  activeTenantId?: string | null
) {
  const memberships = await prisma.membership.findMany({
    where: { userId },
    orderBy: { createdAt: 'asc' },
    select: { tenantId: true },
  });

  if (memberships.length === 0) {
    return null;
  }

  if (
    activeTenantId &&
    memberships.some((membership) => membership.tenantId === activeTenantId)
  ) {
    return activeTenantId;
  }

  return memberships[0]?.tenantId ?? null;
}

async function validateActiveTenantMembership(
  userId: string,
  tenantId: string
) {
  return prisma.membership.findUnique({
    where: {
      tenantId_userId: {
        tenantId,
        userId,
      },
    },
  });
}

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  emailAndPassword: {
    enabled: true,
  },
  session: {
    additionalFields: {
      activeTenantId: {
        type: 'string',
        required: false,
        input: true,
      },
    },
  },
  databaseHooks: {
    session: {
      create: {
        before: async (session) => {
          const activeTenantId = await resolveActiveTenantId(
            session.userId,
            session.activeTenantId as string | null | undefined
          );

          if (!activeTenantId) {
            return;
          }

          return {
            data: {
              ...session,
              activeTenantId,
            },
          };
        },
      },
      update: {
        before: async (session, ctx) => {
          const tenantId = session.activeTenantId as string | undefined;

          if (!tenantId) {
            return;
          }

          const userId = ctx?.context?.session?.user?.id;

          if (!userId) {
            return false;
          }

          const membership = await validateActiveTenantMembership(
            userId,
            tenantId
          );

          if (!membership) {
            return false;
          }
        },
      },
    },
  },
  plugins: [nextCookies()],
});

export type AuthSession = typeof auth.$Infer.Session;
