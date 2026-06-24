'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { APIError } from 'better-auth/api';

import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { slugify } from '@/lib/slug';
import { setActiveTenant } from '@/lib/tenant-context';
import { signUpSchema } from '@/lib/validations/auth';

async function assignActiveTenantToSessionToken(
  sessionToken: string,
  tenantId: string
) {
  await prisma.session.update({
    where: { token: sessionToken },
    data: { activeTenantId: tenantId },
  });
}

export async function signUpAction(input: unknown) {
  const data = signUpSchema.parse(input);

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

  const existingMembership = await prisma.membership.findFirst({
    where: { userId: result.user.id },
  });

  if (!existingMembership) {
    const baseSlug = slugify(data.organizationName) || 'organization';
    let slug = baseSlug;
    let attempt = 0;

    while (await prisma.tenant.findUnique({ where: { slug } })) {
      attempt += 1;
      slug = `${baseSlug}-${attempt}`;
    }

    const tenant = await prisma.tenant.create({
      data: {
        name: data.organizationName,
        slug,
      },
    });

    await prisma.membership.create({
      data: {
        tenantId: tenant.id,
        userId: result.user.id,
        role: 'OWNER',
      },
    });

    if (result.token) {
      await assignActiveTenantToSessionToken(result.token, tenant.id);
    }
  }

  redirect('/dashboard');
}

export async function switchTenantAction(tenantId: string) {
  await setActiveTenant(tenantId);
  redirect('/dashboard');
}

export async function signOutAction() {
  await auth.api.signOut({
    headers: await headers(),
  });

  redirect('/sign-in');
}
