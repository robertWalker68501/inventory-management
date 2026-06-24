'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { Prisma } from '@/app/generated/prisma/client';
import { logActivity } from '@/lib/activity-log';
import {
  canManageTenantSettings,
  canManageTenantSlug,
} from '@/lib/permissions';
import prisma from '@/lib/prisma';
import { slugify } from '@/lib/slug';
import { requireTenantContext } from '@/lib/tenant-context';
import { requireSession } from '@/lib/session';
import {
  updateProfileSchema,
  updateTenantSchema,
} from '@/lib/validations/settings';

function revalidateSettingsPaths() {
  revalidatePath('/dashboard');
  revalidatePath('/dashboard/settings');
  revalidatePath('/dashboard/team');
  revalidatePath('/dashboard/select-tenant');
  revalidatePath('/dashboard/reports');
}

export async function updateTenantSettingsAction(input: unknown) {
  const { tenant, session, role } = await requireTenantContext();

  if (!canManageTenantSettings(role)) {
    throw new Error('You do not have permission to update organization settings.');
  }

  const data = updateTenantSchema.parse(input);
  const canEditSlug = canManageTenantSlug(role);

  if (!canEditSlug && data.slug !== tenant.slug) {
    throw new Error('Only the organization owner can change the slug.');
  }

  const nextSlug = canEditSlug ? data.slug : tenant.slug;

  if (nextSlug !== slugify(nextSlug)) {
    throw new Error('Slug format is invalid.');
  }

  try {
    await prisma.tenant.update({
      where: { id: tenant.id },
      data: {
        name: data.name,
        slug: nextSlug,
      },
    });

    await logActivity({
      tenantId: tenant.id,
      userId: session.user.id,
      action: 'tenant.updated',
      entityType: 'Tenant',
      entityId: tenant.id,
      metadata: { name: data.name, slug: nextSlug },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new Error('This organization slug is already taken.');
    }

    throw error;
  }

  revalidateSettingsPaths();
  redirect('/dashboard/settings');
}

export async function updateProfileAction(input: unknown) {
  const session = await requireSession();
  const data = updateProfileSchema.parse(input);

  await prisma.user.update({
    where: { id: session.user.id },
    data: { name: data.name },
  });

  revalidateSettingsPaths();
  redirect('/dashboard/settings');
}
