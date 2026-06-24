'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { Prisma } from '@/app/generated/prisma/client';
import { getNextDocumentNumber } from '@/lib/document-numbers';
import { logActivity } from '@/lib/activity-log';
import { canManageOperations } from '@/lib/permissions';
import prisma from '@/lib/prisma';
import { requireTenantContext } from '@/lib/tenant-context';
import { orderSchema, pickOrderSchema } from '@/lib/validations/operations';

async function requireOperationsManager() {
  const context = await requireTenantContext();

  if (!canManageOperations(context.role)) {
    throw new Error('You do not have permission to manage operations.');
  }

  return context;
}

function revalidateOrderPaths(id?: string) {
  revalidatePath('/dashboard');
  revalidatePath('/dashboard/orders');
  revalidatePath('/dashboard/shipments');
  revalidatePath('/dashboard/reports');

  if (id) {
    revalidatePath(`/dashboard/orders/${id}`);
  }
}

export async function createOrderAction(input: unknown) {
  const { tenant, session } = await requireOperationsManager();
  const data = orderSchema.parse(input);

  const number = await getNextDocumentNumber(tenant.id, 'ORD');

  try {
    const order = await prisma.order.create({
      data: {
        tenantId: tenant.id,
        number,
        status: 'DRAFT',
        notes: data.notes || null,
        createdById: session.user.id,
        lines: {
          create: data.lines.map((line) => ({
            tenantId: tenant.id,
            inventoryItemId: line.inventoryItemId,
            quantityOrdered: line.quantityOrdered,
          })),
        },
      },
    });

    revalidateOrderPaths();
    redirect(`/dashboard/orders/${order.id}`);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new Error('An order with this number already exists.');
    }

    throw error;
  }
}

export async function updateOrderAction(id: string, input: unknown) {
  const { tenant } = await requireOperationsManager();
  const data = orderSchema.parse(input);

  const existing = await prisma.order.findFirst({
    where: { id, tenantId: tenant.id },
    select: { id: true, status: true },
  });

  if (!existing) {
    throw new Error('Order not found.');
  }

  if (existing.status !== 'DRAFT') {
    throw new Error('Only draft orders can be edited.');
  }

  await prisma.$transaction(async (tx) => {
    await tx.orderLine.deleteMany({
      where: { orderId: id, tenantId: tenant.id },
    });

    await tx.order.update({
      where: { id },
      data: {
        notes: data.notes || null,
        lines: {
          create: data.lines.map((line) => ({
            tenantId: tenant.id,
            inventoryItemId: line.inventoryItemId,
            quantityOrdered: line.quantityOrdered,
          })),
        },
      },
    });
  });

  revalidateOrderPaths(id);
  redirect(`/dashboard/orders/${id}`);
}

export async function confirmOrderAction(id: string) {
  const { tenant, session } = await requireOperationsManager();

  const existing = await prisma.order.findFirst({
    where: { id, tenantId: tenant.id },
    include: { lines: true },
  });

  if (!existing) {
    throw new Error('Order not found.');
  }

  if (existing.status !== 'DRAFT') {
    throw new Error('Only draft orders can be confirmed.');
  }

  if (existing.lines.length === 0) {
    throw new Error('Add at least one line item before confirming.');
  }

  await prisma.order.update({
    where: { id },
    data: {
      status: 'CONFIRMED',
      orderedAt: new Date(),
    },
  });

  await logActivity({
    tenantId: tenant.id,
    userId: session.user.id,
    action: 'order.confirmed',
    entityType: 'Order',
    entityId: id,
    metadata: { number: existing.number, status: 'CONFIRMED' },
  });

  revalidateOrderPaths(id);
  redirect(`/dashboard/orders/${id}`);
}

export async function pickOrderAction(id: string, input: unknown) {
  const { tenant } = await requireOperationsManager();
  const data = pickOrderSchema.parse(input);

  await prisma.$transaction(async (tx) => {
    const order = await tx.order.findFirst({
      where: {
        id,
        tenantId: tenant.id,
        status: { in: ['CONFIRMED', 'PICKING', 'PACKED'] },
      },
      include: { lines: true },
    });

    if (!order) {
      throw new Error('Order not found or not available for picking.');
    }

    for (const pickLine of data.lines) {
      const orderLine = order.lines.find((line) => line.id === pickLine.orderLineId);

      if (!orderLine) {
        throw new Error('Invalid order line.');
      }

      if (pickLine.quantityPicked > orderLine.quantityOrdered) {
        throw new Error('Picked quantity cannot exceed ordered quantity.');
      }

      if (pickLine.quantityPicked < orderLine.quantityShipped) {
        throw new Error('Picked quantity cannot be less than shipped quantity.');
      }

      await tx.orderLine.update({
        where: { id: orderLine.id },
        data: { quantityPicked: pickLine.quantityPicked },
      });
    }

    const updatedLines = await tx.orderLine.findMany({
      where: { orderId: id },
      select: {
        quantityOrdered: true,
        quantityPicked: true,
      },
    });

    const allPicked = updatedLines.every(
      (line) => line.quantityPicked >= line.quantityOrdered
    );
    const anyPicked = updatedLines.some((line) => line.quantityPicked > 0);

    await tx.order.update({
      where: { id },
      data: {
        status: allPicked ? 'PACKED' : anyPicked ? 'PICKING' : 'CONFIRMED',
      },
    });
  });

  revalidateOrderPaths(id);
  redirect(`/dashboard/orders/${id}`);
}

export async function cancelOrderAction(id: string) {
  const { tenant } = await requireOperationsManager();

  const existing = await prisma.order.findFirst({
    where: { id, tenantId: tenant.id },
    select: { id: true, status: true },
  });

  if (!existing) {
    throw new Error('Order not found.');
  }

  if (!['DRAFT', 'CONFIRMED'].includes(existing.status)) {
    throw new Error('This order cannot be cancelled.');
  }

  await prisma.order.update({
    where: { id },
    data: { status: 'CANCELLED' },
  });

  revalidateOrderPaths(id);
  redirect(`/dashboard/orders/${id}`);
}

export async function deleteOrderAction(id: string) {
  const { tenant } = await requireOperationsManager();

  const existing = await prisma.order.findFirst({
    where: { id, tenantId: tenant.id },
    select: { id: true, status: true },
  });

  if (!existing) {
    throw new Error('Order not found.');
  }

  if (existing.status !== 'DRAFT') {
    throw new Error('Only draft orders can be deleted.');
  }

  await prisma.order.delete({ where: { id } });

  revalidateOrderPaths();
  redirect('/dashboard/orders');
}
