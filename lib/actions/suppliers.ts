'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { Prisma } from '@/app/generated/prisma/client';
import { canManageOperations } from '@/lib/permissions';
import prisma from '@/lib/prisma';
import { requireTenantContext } from '@/lib/tenant-context';
import { supplierSchema } from '@/lib/validations/operations';

async function requireOperationsManager() {
  const context = await requireTenantContext();

  if (!canManageOperations(context.role)) {
    throw new Error('You do not have permission to manage operations.');
  }

  return context;
}

function revalidateSupplierPaths() {
  revalidatePath('/dashboard');
  revalidatePath('/dashboard/suppliers');
  revalidatePath('/dashboard/purchase-orders');
}

export async function createSupplierAction(input: unknown) {
  const { tenant } = await requireOperationsManager();
  const data = supplierSchema.parse(input);

  try {
    const supplier = await prisma.supplier.create({
      data: {
        tenantId: tenant.id,
        name: data.name,
        email: data.email || null,
        phone: data.phone || null,
        address: data.address || null,
        notes: data.notes || null,
        isActive: data.isActive,
      },
    });

    revalidateSupplierPaths();
    redirect(`/dashboard/suppliers/${supplier.id}`);
  } catch (error) {
    throw error;
  }
}

export async function updateSupplierAction(id: string, input: unknown) {
  const { tenant } = await requireOperationsManager();
  const data = supplierSchema.parse(input);

  const existing = await prisma.supplier.findFirst({
    where: { id, tenantId: tenant.id },
    select: { id: true },
  });

  if (!existing) {
    throw new Error('Supplier not found.');
  }

  await prisma.supplier.update({
    where: { id },
    data: {
      name: data.name,
      email: data.email || null,
      phone: data.phone || null,
      address: data.address || null,
      notes: data.notes || null,
      isActive: data.isActive,
    },
  });

  revalidateSupplierPaths();
  redirect(`/dashboard/suppliers/${id}`);
}

export async function deleteSupplierAction(id: string) {
  const { tenant } = await requireOperationsManager();

  const existing = await prisma.supplier.findFirst({
    where: { id, tenantId: tenant.id },
    select: { id: true },
  });

  if (!existing) {
    throw new Error('Supplier not found.');
  }

  const poCount = await prisma.purchaseOrder.count({
    where: { supplierId: id, tenantId: tenant.id },
  });

  if (poCount > 0) {
    throw new Error('Cannot delete a supplier with purchase orders.');
  }

  await prisma.supplier.delete({ where: { id } });

  revalidateSupplierPaths();
  redirect('/dashboard/suppliers');
}
