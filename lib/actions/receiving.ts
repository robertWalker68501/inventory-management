'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { Prisma } from '@/app/generated/prisma/client';
import { getNextDocumentNumber } from '@/lib/document-numbers';
import { logActivity } from '@/lib/activity-log';
import { canManageOperations } from '@/lib/permissions';
import prisma from '@/lib/prisma';
import { requireTenantContext } from '@/lib/tenant-context';
import { receivingSchema } from '@/lib/validations/operations';

async function requireOperationsManager() {
  const context = await requireTenantContext();

  if (!canManageOperations(context.role)) {
    throw new Error('You do not have permission to manage operations.');
  }

  return context;
}

function revalidateReceivingPaths(id?: string) {
  revalidatePath('/dashboard');
  revalidatePath('/dashboard/receiving');
  revalidatePath('/dashboard/purchase-orders');
  revalidatePath('/dashboard/stock');
  revalidatePath('/dashboard/inventory');
  revalidatePath('/dashboard/reports');

  if (id) {
    revalidatePath(`/dashboard/receiving/${id}`);
  }
}

async function syncPurchaseOrderStatus(
  tx: Prisma.TransactionClient,
  purchaseOrderId: string
) {
  const po = await tx.purchaseOrder.findUnique({
    where: { id: purchaseOrderId },
    include: { lines: true },
  });

  if (!po || po.status === 'CANCELLED' || po.status === 'DRAFT') {
    return;
  }

  const allReceived = po.lines.every(
    (line) => line.quantityReceived >= line.quantityOrdered
  );
  const anyReceived = po.lines.some((line) => line.quantityReceived > 0);

  await tx.purchaseOrder.update({
    where: { id: purchaseOrderId },
    data: {
      status: allReceived
        ? 'RECEIVED'
        : anyReceived
          ? 'PARTIALLY_RECEIVED'
          : 'SUBMITTED',
    },
  });
}

export async function createReceivingAction(input: unknown) {
  const { tenant } = await requireOperationsManager();
  const data = receivingSchema.parse(input);

  const warehouse = await prisma.warehouse.findFirst({
    where: { id: data.warehouseId, tenantId: tenant.id, isActive: true },
    select: { id: true },
  });

  if (!warehouse) {
    throw new Error('Warehouse not found.');
  }

  if (data.purchaseOrderId) {
    const po = await prisma.purchaseOrder.findFirst({
      where: {
        id: data.purchaseOrderId,
        tenantId: tenant.id,
        status: { in: ['SUBMITTED', 'PARTIALLY_RECEIVED'] },
      },
      select: { id: true },
    });

    if (!po) {
      throw new Error('Purchase order not found or not open for receiving.');
    }
  }

  const number = await getNextDocumentNumber(tenant.id, 'REC');

  try {
    const receiving = await prisma.receiving.create({
      data: {
        tenantId: tenant.id,
        warehouseId: data.warehouseId,
        purchaseOrderId: data.purchaseOrderId || null,
        number,
        status: 'DRAFT',
        notes: data.notes || null,
        lines: {
          create: data.lines.map((line) => ({
            tenantId: tenant.id,
            inventoryItemId: line.inventoryItemId,
            purchaseOrderLineId: line.purchaseOrderLineId || null,
            stockLocationId: line.stockLocationId || null,
            quantityReceived: line.quantityReceived,
          })),
        },
      },
    });

    revalidateReceivingPaths();
    redirect(`/dashboard/receiving/${receiving.id}`);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new Error('A receiving record with this number already exists.');
    }

    throw error;
  }
}

export async function updateReceivingAction(id: string, input: unknown) {
  const { tenant } = await requireOperationsManager();
  const data = receivingSchema.parse(input);

  const existing = await prisma.receiving.findFirst({
    where: { id, tenantId: tenant.id },
    select: { id: true, status: true },
  });

  if (!existing) {
    throw new Error('Receiving record not found.');
  }

  if (existing.status !== 'DRAFT') {
    throw new Error('Only draft receivings can be edited.');
  }

  await prisma.$transaction(async (tx) => {
    await tx.receivingLine.deleteMany({
      where: { receivingId: id, tenantId: tenant.id },
    });

    await tx.receiving.update({
      where: { id },
      data: {
        warehouseId: data.warehouseId,
        purchaseOrderId: data.purchaseOrderId || null,
        notes: data.notes || null,
        lines: {
          create: data.lines.map((line) => ({
            tenantId: tenant.id,
            inventoryItemId: line.inventoryItemId,
            purchaseOrderLineId: line.purchaseOrderLineId || null,
            stockLocationId: line.stockLocationId || null,
            quantityReceived: line.quantityReceived,
          })),
        },
      },
    });
  });

  revalidateReceivingPaths(id);
  redirect(`/dashboard/receiving/${id}`);
}

export async function completeReceivingAction(id: string) {
  const { tenant, session } = await requireOperationsManager();

  await prisma.$transaction(async (tx) => {
    const receiving = await tx.receiving.findFirst({
      where: { id, tenantId: tenant.id, status: 'DRAFT' },
      include: { lines: true },
    });

    if (!receiving) {
      throw new Error('Receiving record not found or already completed.');
    }

    const linesToProcess = receiving.lines.filter(
      (line) => line.quantityReceived > 0
    );

    if (linesToProcess.length === 0) {
      throw new Error('Enter received quantities before completing.');
    }

    for (const line of linesToProcess) {
      if (!line.stockLocationId) {
        throw new Error('Each received line needs a stock location.');
      }

      const location = await tx.stockLocation.findFirst({
        where: {
          id: line.stockLocationId,
          tenantId: tenant.id,
          warehouseId: receiving.warehouseId,
        },
        select: { id: true },
      });

      if (!location) {
        throw new Error('Invalid stock location for this warehouse.');
      }

      await tx.inventoryStock.upsert({
        where: {
          inventoryItemId_stockLocationId: {
            inventoryItemId: line.inventoryItemId,
            stockLocationId: line.stockLocationId,
          },
        },
        create: {
          tenantId: tenant.id,
          inventoryItemId: line.inventoryItemId,
          stockLocationId: line.stockLocationId,
          quantityOnHand: line.quantityReceived,
        },
        update: {
          quantityOnHand: { increment: line.quantityReceived },
        },
      });

      await tx.stockMovement.create({
        data: {
          tenantId: tenant.id,
          inventoryItemId: line.inventoryItemId,
          stockLocationId: line.stockLocationId,
          movementType: 'RECEIVING',
          quantity: line.quantityReceived,
          referenceType: 'Receiving',
          referenceId: receiving.id,
          createdById: session.user.id,
        },
      });

      if (line.purchaseOrderLineId) {
        await tx.purchaseOrderLine.update({
          where: { id: line.purchaseOrderLineId },
          data: {
            quantityReceived: { increment: line.quantityReceived },
          },
        });
      }
    }

    if (receiving.purchaseOrderId) {
      await syncPurchaseOrderStatus(tx, receiving.purchaseOrderId);
    }

    await tx.receiving.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        receivedAt: new Date(),
        receivedById: session.user.id,
      },
    });
  });

  const receiving = await prisma.receiving.findUnique({
    where: { id },
    select: { number: true },
  });

  await logActivity({
    tenantId: tenant.id,
    userId: session.user.id,
    action: 'receiving.completed',
    entityType: 'Receiving',
    entityId: id,
    metadata: { number: receiving?.number },
  });

  revalidateReceivingPaths(id);
  redirect(`/dashboard/receiving/${id}`);
}

export async function cancelReceivingAction(id: string) {
  const { tenant } = await requireOperationsManager();

  const existing = await prisma.receiving.findFirst({
    where: { id, tenantId: tenant.id },
    select: { id: true, status: true },
  });

  if (!existing) {
    throw new Error('Receiving record not found.');
  }

  if (existing.status !== 'DRAFT') {
    throw new Error('Only draft receivings can be cancelled.');
  }

  await prisma.receiving.update({
    where: { id },
    data: { status: 'CANCELLED' },
  });

  revalidateReceivingPaths(id);
  redirect(`/dashboard/receiving/${id}`);
}
