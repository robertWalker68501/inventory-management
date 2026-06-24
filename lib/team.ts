import type { MembershipRole } from '@/app/generated/prisma/client';
import prisma from '@/lib/prisma';

export type TeamMember = {
  id: string;
  userId: string;
  role: MembershipRole;
  createdAt: Date;
  user: {
    id: string;
    name: string;
    email: string;
    image: string | null;
  };
};

export type PendingInvitation = {
  id: string;
  email: string;
  role: MembershipRole;
  status: string;
  token: string;
  expiresAt: Date;
  createdAt: Date;
  invitedBy: {
    name: string;
  } | null;
};

export async function listTeamMembers(tenantId: string) {
  const members = await prisma.membership.findMany({
    where: { tenantId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
    },
    orderBy: [{ role: 'desc' }, { createdAt: 'asc' }],
  });

  return members.map((member) => ({
    id: member.id,
    userId: member.userId,
    role: member.role,
    createdAt: member.createdAt,
    user: member.user,
  })) satisfies TeamMember[];
}

export async function listPendingInvitations(tenantId: string) {
  const now = new Date();

  return prisma.tenantInvitation.findMany({
    where: {
      tenantId,
      status: 'PENDING',
      expiresAt: { gte: now },
    },
    select: {
      id: true,
      email: true,
      role: true,
      status: true,
      token: true,
      expiresAt: true,
      createdAt: true,
      invitedBy: {
        select: { name: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getInvitationByToken(token: string) {
  const invitation = await prisma.tenantInvitation.findUnique({
    where: { token },
    include: {
      tenant: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
      invitedBy: {
        select: {
          name: true,
        },
      },
    },
  });

  if (!invitation) {
    return null;
  }

  if (
    invitation.status === 'PENDING' &&
    invitation.expiresAt < new Date()
  ) {
    await prisma.tenantInvitation.update({
      where: { id: invitation.id },
      data: { status: 'EXPIRED' },
    });

    return {
      ...invitation,
      status: 'EXPIRED' as const,
    };
  }

  return invitation;
}

export async function countTenantOwners(tenantId: string) {
  return prisma.membership.count({
    where: { tenantId, role: 'OWNER' },
  });
}
