'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { Prisma } from '@/app/generated/prisma/client';
import { getNextDocumentNumber } from '@/lib/document-numbers';
import { logActivity } from '@/lib/activity-log';
import { canManageOperations } from '@/lib/permissions';
import prisma from '@/lib/prisma';
import { requireTenantContext } from '@/lib/tenant-context';
import { purchaseOrderSchema } from '@/lib/validations/operations';

async function requireOperationsManager() {
  const context = await requireTenantContext();

  if (!canManageOperations(context.role)) {
    throw new Error('You do not have permission to manage operations.');
  }

  return context;
}

function revalidatePurchaseOrderPaths(id?: string) {
  revalidatePath('/dashboard');
  revalidatePath('/dashboard/purchase-orders');
  revalidatePath('/dashboard/receiving');
  revalidatePath('/dashboard/suppliers');
  revalidatePath('/dashboard/reports');

  if (id) {
    revalidatePath(`/dashboard/purchase-orders/${id}`);
  }
}

export async function createPurchaseOrderAction(input: unknown) {
  const { tenant, session } = await requireOperationsManager();
  const data = purchaseOrderSchema.parse(input);

  const supplier = await prisma.supplier.findFirst({
    where: { id: data.supplierId, tenantId: tenant.id, isActive: true },
    select: { id: true },
  });

  if (!supplier) {
    throw new Error('Supplier not found.');
  }

  const number = await getNextDocumentNumber(tenant.id, 'PO');

  try {
    const purchaseOrder = await prisma.purchaseOrder.create({
      data: {
        tenantId: tenant.id,
        supplierId: data.supplierId,
        number,
        status: 'DRAFT',
        expectedAt: data.expectedAt ? new Date(data.expectedAt) : null,
        notes: data.notes || null,
        createdById: session.user.id,
        lines: {
          create: data.lines.map((line) => ({
            tenantId: tenant.id,
            inventoryItemId: line.inventoryItemId,
            quantityOrdered: line.quantityOrdered,
            unitCost: line.unitCost ?? null,
          })),
        },
      },
    });

    revalidatePurchaseOrderPaths();
    redirect(`/dashboard/purchase-orders/${purchaseOrder.id}`);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new Error('A purchase order with this number already exists.');
    }

    throw error;
  }
}

export async function updatePurchaseOrderAction(id: string, input: unknown) {
  const { tenant } = await requireOperationsManager();
  const data = purchaseOrderSchema.parse(input);

  const existing = await prisma.purchaseOrder.findFirst({
    where: { id, tenantId: tenant.id },
    select: { id: true, status: true },
  });

  if (!existing) {
    throw new Error('Purchase order not found.');
  }

  if (existing.status !== 'DRAFT') {
    throw new Error('Only draft purchase orders can be edited.');
  }

  await prisma.$transaction(async (tx) => {
    await tx.purchaseOrderLine.deleteMany({
      where: { purchaseOrderId: id, tenantId: tenant.id },
    });

    await tx.purchaseOrder.update({
      where: { id },
      data: {
        supplierId: data.supplierId,
        expectedAt: data.expectedAt ? new Date(data.expectedAt) : null,
        notes: data.notes || null,
        lines: {
          create: data.lines.map((line) => ({
            tenantId: tenant.id,
            inventoryItemId: line.inventoryItemId,
            quantityOrdered: line.quantityOrdered,
            unitCost: line.unitCost ?? null,
          })),
        },
      },
    });
  });

  revalidatePurchaseOrderPaths(id);
  redirect(`/dashboard/purchase-orders/${id}`);
}

export async function submitPurchaseOrderAction(id: string) {
  const { tenant, session } = await requireOperationsManager();

  const existing = await prisma.purchaseOrder.findFirst({
    where: { id, tenantId: tenant.id },
    include: { lines: true },
  });

  if (!existing) {
    throw new Error('Purchase order not found.');
  }

  if (existing.status !== 'DRAFT') {
    throw new Error('Only draft purchase orders can be submitted.');
  }

  if (existing.lines.length === 0) {
    throw new Error('Add at least one line item before submitting.');
  }

  await prisma.purchaseOrder.update({
    where: { id },
    data: {
      status: 'SUBMITTED',
      orderedAt: new Date(),
    },
  });

  await logActivity({
    tenantId: tenant.id,
    userId: session.user.id,
    action: 'purchase_order.submitted',
    entityType: 'PurchaseOrder',
    entityId: id,
    metadata: { number: existing.number, status: 'SUBMITTED' },
  });

  revalidatePurchaseOrderPaths(id);
  redirect(`/dashboard/purchase-orders/${id}`);
}

export async function cancelPurchaseOrderAction(id: string) {
  const { tenant } = await requireOperationsManager();

  const existing = await prisma.purchaseOrder.findFirst({
    where: { id, tenantId: tenant.id },
    select: { id: true, status: true },
  });

  if (!existing) {
    throw new Error('Purchase order not found.');
  }

  if (!['DRAFT', 'SUBMITTED'].includes(existing.status)) {
    throw new Error('This purchase order cannot be cancelled.');
  }

  await prisma.purchaseOrder.update({
    where: { id },
    data: { status: 'CANCELLED' },
  });

  revalidatePurchaseOrderPaths(id);
  redirect(`/dashboard/purchase-orders/${id}`);
}

export async function deletePurchaseOrderAction(id: string) {
  const { tenant } = await requireOperationsManager();

  const existing = await prisma.purchaseOrder.findFirst({
    where: { id, tenantId: tenant.id },
    select: { id: true, status: true },
  });

  if (!existing) {
    throw new Error('Purchase order not found.');
  }

  if (existing.status !== 'DRAFT') {
    throw new Error('Only draft purchase orders can be deleted.');
  }

  await prisma.purchaseOrder.delete({ where: { id } });

  revalidatePurchaseOrderPaths();
  redirect('/dashboard/purchase-orders');
}
