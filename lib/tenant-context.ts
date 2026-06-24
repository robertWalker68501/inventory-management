import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

import type { MembershipRole } from '@/app/generated/prisma/client';
import { auth } from '@/lib/auth';
import { hasMinimumRole } from '@/lib/permissions';
import prisma from '@/lib/prisma';
import { requireSession } from '@/lib/session';

export async function getUserMemberships(userId: string) {
  return prisma.membership.findMany({
    where: { userId },
    include: { tenant: true },
    orderBy: { createdAt: 'asc' },
  });
}

export async function setActiveTenant(tenantId: string) {
  const session = await requireSession();

  const membership = await prisma.membership.findUnique({
    where: {
      tenantId_userId: {
        tenantId,
        userId: session.user.id,
      },
    },
  });

  if (!membership) {
    throw new Error('You do not have access to this organization.');
  }

  await auth.api.updateSession({
    body: {
      activeTenantId: tenantId,
    },
    headers: await headers(),
  });

  return membership;
}

export async function getTenantContext() {
  const session = await requireSession();
  const memberships = await getUserMemberships(session.user.id);

  if (memberships.length === 0) {
    return null;
  }

  const activeTenantId = session.session.activeTenantId as string | undefined;
  let membership = memberships.find(
    (item) => item.tenantId === activeTenantId
  );

  if (!membership) {
    if (memberships.length === 1) {
      membership = memberships[0];
      await setActiveTenant(membership.tenantId);
    } else {
      return null;
    }
  }

  return {
    session,
    tenant: membership.tenant,
    role: membership.role,
    membership,
    memberships,
  };
}

export async function requireTenantContext() {
  const context = await getTenantContext();

  if (!context) {
    redirect('/dashboard/select-tenant');
  }

  return context;
}

export async function requireRole(minimumRole: MembershipRole) {
  const context = await requireTenantContext();

  if (!hasMinimumRole(context.role, minimumRole)) {
    redirect('/dashboard');
  }

  return context;
}
