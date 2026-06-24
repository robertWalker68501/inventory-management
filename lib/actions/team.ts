'use server';

import { randomBytes } from 'node:crypto';

import { logActivity } from '@/lib/activity-log';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { APIError } from 'better-auth/api';

import { Prisma } from '@/app/generated/prisma/client';
import type { MembershipRole } from '@/app/generated/prisma/client';
import { auth } from '@/lib/auth';
import {
  canAssignRole,
  canManageMember,
  canManageTeam,
} from '@/lib/permissions';
import prisma from '@/lib/prisma';
import { countTenantOwners, getInvitationByToken } from '@/lib/team';
import { requireTenantContext } from '@/lib/tenant-context';
import {
  inviteMemberSchema,
  inviteSignUpSchema,
  updateMemberRoleSchema,
} from '@/lib/validations/team';

const INVITE_EXPIRY_DAYS = 7;

async function requireTeamManager() {
  const context = await requireTenantContext();

  if (!canManageTeam(context.role)) {
    throw new Error('You do not have permission to manage team members.');
  }

  return context;
}

function revalidateTeamPaths() {
  revalidatePath('/dashboard');
  revalidatePath('/dashboard/team');
  revalidatePath('/dashboard/settings');
  revalidatePath('/dashboard/reports');
}

function generateInviteToken() {
  return randomBytes(24).toString('hex');
}

function inviteExpiryDate() {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + INVITE_EXPIRY_DAYS);
  return expiresAt;
}

async function assignActiveTenantToSessionToken(
  sessionToken: string,
  tenantId: string
) {
  await prisma.session.update({
    where: { token: sessionToken },
    data: { activeTenantId: tenantId },
  });
}

async function acceptInvitationForUser(
  invitationId: string,
  userId: string,
  userEmail: string
) {
  const invitation = await prisma.tenantInvitation.findUnique({
    where: { id: invitationId },
  });

  if (!invitation) {
    throw new Error('Invitation not found.');
  }

  if (invitation.status !== 'PENDING') {
    throw new Error('This invitation is no longer valid.');
  }

  if (invitation.expiresAt < new Date()) {
    await prisma.tenantInvitation.update({
      where: { id: invitation.id },
      data: { status: 'EXPIRED' },
    });
    throw new Error('This invitation has expired.');
  }

  if (invitation.email.toLowerCase() !== userEmail.toLowerCase()) {
    throw new Error('This invitation was sent to a different email address.');
  }

  const existingMembership = await prisma.membership.findUnique({
    where: {
      tenantId_userId: {
        tenantId: invitation.tenantId,
        userId,
      },
    },
  });

  if (existingMembership) {
    await prisma.tenantInvitation.update({
      where: { id: invitation.id },
      data: {
        status: 'ACCEPTED',
        acceptedAt: new Date(),
      },
    });

    return invitation.tenantId;
  }

  await prisma.$transaction([
    prisma.membership.create({
      data: {
        tenantId: invitation.tenantId,
        userId,
        role: invitation.role,
      },
    }),
    prisma.tenantInvitation.update({
      where: { id: invitation.id },
      data: {
        status: 'ACCEPTED',
        acceptedAt: new Date(),
      },
    }),
  ]);

  return invitation.tenantId;
}

export async function inviteMemberAction(input: unknown) {
  const { tenant, session, role } = await requireTeamManager();
  const data = inviteMemberSchema.parse(input);
  const email = data.email.toLowerCase();

  if (!canAssignRole(role, data.role)) {
    throw new Error('You cannot assign this role.');
  }

  const existingMember = await prisma.membership.findFirst({
    where: {
      tenantId: tenant.id,
      user: { email: { equals: email, mode: 'insensitive' } },
    },
    select: { id: true },
  });

  if (existingMember) {
    throw new Error('This user is already a member of the organization.');
  }

  const pendingInvite = await prisma.tenantInvitation.findFirst({
    where: {
      tenantId: tenant.id,
      email: { equals: email, mode: 'insensitive' },
      status: 'PENDING',
      expiresAt: { gte: new Date() },
    },
    select: { id: true },
  });

  if (pendingInvite) {
    throw new Error('A pending invitation already exists for this email.');
  }

  const existingUser = await prisma.user.findFirst({
    where: { email: { equals: email, mode: 'insensitive' } },
    select: { id: true, email: true },
  });

  if (existingUser) {
    await prisma.membership.create({
      data: {
        tenantId: tenant.id,
        userId: existingUser.id,
        role: data.role,
      },
    });

    await logActivity({
      tenantId: tenant.id,
      userId: session.user.id,
      action: 'team.member_added',
      entityType: 'Membership',
      entityId: existingUser.id,
      metadata: { email, role: data.role },
    });

    revalidateTeamPaths();
    redirect('/dashboard/team');
  }

  const token = generateInviteToken();

  try {
    await prisma.tenantInvitation.create({
      data: {
        tenantId: tenant.id,
        email,
        role: data.role,
        token,
        status: 'PENDING',
        invitedById: session.user.id,
        expiresAt: inviteExpiryDate(),
      },
    });

    await logActivity({
      tenantId: tenant.id,
      userId: session.user.id,
      action: 'team.invitation_sent',
      entityType: 'TenantInvitation',
      metadata: { email, role: data.role },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new Error('A pending invitation already exists for this email.');
    }

    throw error;
  }

  revalidateTeamPaths();
  redirect('/dashboard/team');
}

export async function updateMemberRoleAction(
  membershipId: string,
  input: unknown
) {
  const { tenant, session, role: actorRole } = await requireTeamManager();
  const data = updateMemberRoleSchema.parse(input);

  if (!canAssignRole(actorRole, data.role)) {
    throw new Error('You cannot assign this role.');
  }

  const membership = await prisma.membership.findFirst({
    where: { id: membershipId, tenantId: tenant.id },
    select: { id: true, userId: true, role: true },
  });

  if (!membership) {
    throw new Error('Team member not found.');
  }

  if (
    !canManageMember(
      actorRole,
      session.user.id,
      membership.userId,
      membership.role
    )
  ) {
    throw new Error('You do not have permission to update this member.');
  }

  if (membership.role === 'OWNER') {
    throw new Error('The organization owner role cannot be changed here.');
  }

  await prisma.membership.update({
    where: { id: membershipId },
    data: { role: data.role },
  });

  revalidateTeamPaths();
  redirect('/dashboard/team');
}

export async function removeMemberAction(membershipId: string) {
  const { tenant, session, role: actorRole } = await requireTeamManager();

  const membership = await prisma.membership.findFirst({
    where: { id: membershipId, tenantId: tenant.id },
    select: { id: true, userId: true, role: true },
  });

  if (!membership) {
    throw new Error('Team member not found.');
  }

  if (
    !canManageMember(
      actorRole,
      session.user.id,
      membership.userId,
      membership.role
    )
  ) {
    throw new Error('You do not have permission to remove this member.');
  }

  if (membership.role === 'OWNER') {
    const ownerCount = await countTenantOwners(tenant.id);

    if (ownerCount <= 1) {
      throw new Error('Cannot remove the only organization owner.');
    }
  }

  await prisma.membership.delete({
    where: { id: membershipId },
  });

  revalidateTeamPaths();
  redirect('/dashboard/team');
}

export async function cancelInvitationAction(invitationId: string) {
  const { tenant } = await requireTeamManager();

  const invitation = await prisma.tenantInvitation.findFirst({
    where: {
      id: invitationId,
      tenantId: tenant.id,
      status: 'PENDING',
    },
    select: { id: true },
  });

  if (!invitation) {
    throw new Error('Invitation not found.');
  }

  await prisma.tenantInvitation.update({
    where: { id: invitationId },
    data: { status: 'CANCELLED' },
  });

  revalidateTeamPaths();
  redirect('/dashboard/team');
}

export async function acceptInvitationAction(token: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect(`/sign-in?callbackUrl=${encodeURIComponent(`/invite/${token}`)}`);
  }

  const invitation = await getInvitationByToken(token);

  if (!invitation || invitation.status !== 'PENDING') {
    throw new Error('This invitation is no longer valid.');
  }

  const tenantId = await acceptInvitationForUser(
    invitation.id,
    session.user.id,
    session.user.email
  );

  await auth.api.updateSession({
    body: { activeTenantId: tenantId },
    headers: await headers(),
  });

  revalidateTeamPaths();
  redirect('/dashboard');
}

export async function inviteSignUpAction(token: string, input: unknown) {
  const data = inviteSignUpSchema.parse(input);

  const invitation = await getInvitationByToken(token);

  if (!invitation || invitation.status !== 'PENDING') {
    throw new Error('This invitation is no longer valid.');
  }

  if (data.email.toLowerCase() !== invitation.email.toLowerCase()) {
    throw new Error('Email must match the invitation.');
  }

  let result;

  try {
    result = await auth.api.signUpEmail({
      body: {
        name: data.name,
        email: data.email,
        password: data.password,
      },
      headers: await headers(),
    });
  } catch (error) {
    if (error instanceof APIError) {
      throw new Error(error.message || 'Unable to create account.');
    }

    throw error;
  }

  if (!result?.user) {
    throw new Error('Failed to create account.');
  }

  const tenantId = await acceptInvitationForUser(
    invitation.id,
    result.user.id,
    result.user.email
  );

  if (result.token) {
    await assignActiveTenantToSessionToken(result.token, tenantId);
  }

  revalidateTeamPaths();
  redirect('/dashboard');
}
