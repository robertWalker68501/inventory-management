'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import type { Prisma } from '@/app/generated/prisma/client';
import { getNextDocumentNumber } from '@/lib/document-numbers';
import { logActivity } from '@/lib/activity-log';
import { canManageOperations } from '@/lib/permissions';
import prisma from '@/lib/prisma';
import { requireTenantContext } from '@/lib/tenant-context';
import { shipmentSchema } from '@/lib/validations/operations';

async function requireOperationsManager() {
  const context = await requireTenantContext();

  if (!canManageOperations(context.role)) {
    throw new Error('You do not have permission to manage operations.');
  }

  return context;
}

function revalidateShipmentPaths(id?: string) {
  revalidatePath('/dashboard');
  revalidatePath('/dashboard/shipments');
  revalidatePath('/dashboard/orders');
  revalidatePath('/dashboard/stock');
  revalidatePath('/dashboard/inventory');
  revalidatePath('/dashboard/reports');

  if (id) {
    revalidatePath(`/dashboard/shipments/${id}`);
  }
}

async function deductStockFromWarehouse(
  tx: Prisma.TransactionClient,
  params: {
    tenantId: string;
    warehouseId: string;
    inventoryItemId: string;
    quantity: number;
    referenceId: string;
    createdById: string;
  }
) {
  const stocks = await tx.inventoryStock.findMany({
    where: {
      tenantId: params.tenantId,
      inventoryItemId: params.inventoryItemId,
      stockLocation: { warehouseId: params.warehouseId },
      quantityOnHand: { gt: 0 },
    },
    orderBy: { quantityOnHand: 'desc' },
  });

  let remaining = params.quantity;

  for (const stock of stocks) {
    if (remaining <= 0) {
      break;
    }

    const available = stock.quantityOnHand - stock.quantityReserved;
    const deduct = Math.min(available, remaining);

    if (deduct <= 0) {
      continue;
    }

    await tx.inventoryStock.update({
      where: { id: stock.id },
      data: { quantityOnHand: { decrement: deduct } },
    });

    await tx.stockMovement.create({
      data: {
        tenantId: params.tenantId,
        inventoryItemId: params.inventoryItemId,
        stockLocationId: stock.stockLocationId,
        movementType: 'SHIP',
        quantity: -deduct,
        referenceType: 'Shipment',
        referenceId: params.referenceId,
        createdById: params.createdById,
      },
    });

    remaining -= deduct;
  }

  if (remaining > 0) {
    throw new Error('Insufficient stock in the selected warehouse.');
  }
}

async function syncOrderStatusAfterShipment(
  tx: Prisma.TransactionClient,
  orderId: string
) {
  const order = await tx.order.findUnique({
    where: { id: orderId },
    include: { lines: true },
  });

  if (!order || order.status === 'CANCELLED') {
    return;
  }

  const allShipped = order.lines.every(
    (line) => line.quantityShipped >= line.quantityOrdered
  );

  if (allShipped) {
    await tx.order.update({
      where: { id: orderId },
      data: { status: 'SHIPPED' },
    });
  }
}

export async function createShipmentAction(input: unknown) {
  const { tenant, session } = await requireOperationsManager();
  const data = shipmentSchema.parse(input);

  const warehouse = await prisma.warehouse.findFirst({
    where: { id: data.warehouseId, tenantId: tenant.id, isActive: true },
    select: { id: true },
  });

  if (!warehouse) {
    throw new Error('Warehouse not found.');
  }

  if (data.orderId) {
    const order = await prisma.order.findFirst({
      where: {
        id: data.orderId,
        tenantId: tenant.id,
        status: { in: ['CONFIRMED', 'PICKING', 'PACKED'] },
      },
      select: { id: true },
    });

    if (!order) {
      throw new Error('Order not found or not available for shipping.');
    }
  }

  const number = await getNextDocumentNumber(tenant.id, 'SHP');

  try {
    const shipment = await prisma.shipment.create({
      data: {
        tenantId: tenant.id,
        orderId: data.orderId || null,
        warehouseId: data.warehouseId,
        number,
        status: 'DRAFT',
        trackingNumber: data.trackingNumber || null,
        notes: data.notes || null,
        shippedById: session.user.id,
        lines: {
          create: data.lines.map((line) => ({
            tenantId: tenant.id,
            orderLineId: line.orderLineId || null,
            inventoryItemId: line.inventoryItemId,
            quantityShipped: line.quantityShipped,
          })),
        },
      },
    });

    revalidateShipmentPaths();
    redirect(`/dashboard/shipments/${shipment.id}`);
  } catch (error) {
    throw error;
  }
}

export async function updateShipmentAction(id: string, input: unknown) {
  const { tenant } = await requireOperationsManager();
  const data = shipmentSchema.parse(input);

  const existing = await prisma.shipment.findFirst({
    where: { id, tenantId: tenant.id },
    select: { id: true, status: true },
  });

  if (!existing) {
    throw new Error('Shipment not found.');
  }

  if (existing.status !== 'DRAFT') {
    throw new Error('Only draft shipments can be edited.');
  }

  await prisma.$transaction(async (tx) => {
    await tx.shipmentLine.deleteMany({
      where: { shipmentId: id, tenantId: tenant.id },
    });

    await tx.shipment.update({
      where: { id },
      data: {
        orderId: data.orderId || null,
        warehouseId: data.warehouseId,
        trackingNumber: data.trackingNumber || null,
        notes: data.notes || null,
        lines: {
          create: data.lines.map((line) => ({
            tenantId: tenant.id,
            orderLineId: line.orderLineId || null,
            inventoryItemId: line.inventoryItemId,
            quantityShipped: line.quantityShipped,
          })),
        },
      },
    });
  });

  revalidateShipmentPaths(id);
  redirect(`/dashboard/shipments/${id}`);
}

export async function shipShipmentAction(id: string) {
  const { tenant, session } = await requireOperationsManager();

  await prisma.$transaction(async (tx) => {
    const shipment = await tx.shipment.findFirst({
      where: { id, tenantId: tenant.id, status: 'DRAFT' },
      include: { lines: true },
    });

    if (!shipment) {
      throw new Error('Shipment not found or already shipped.');
    }

    const linesToShip = shipment.lines.filter(
      (line) => line.quantityShipped > 0
    );

    if (linesToShip.length === 0) {
      throw new Error('Enter shipped quantities before completing.');
    }

    for (const line of linesToShip) {
      if (line.orderLineId) {
        const orderLine = await tx.orderLine.findUnique({
          where: { id: line.orderLineId },
          select: {
            quantityOrdered: true,
            quantityPicked: true,
            quantityShipped: true,
          },
        });

        if (!orderLine) {
          throw new Error('Linked order line not found.');
        }

        const remainingToShip =
          orderLine.quantityOrdered - orderLine.quantityShipped;

        if (line.quantityShipped > remainingToShip) {
          throw new Error('Shipped quantity exceeds remaining order quantity.');
        }

        if (line.quantityShipped > orderLine.quantityPicked) {
          throw new Error('Shipped quantity exceeds picked quantity.');
        }
      }

      await deductStockFromWarehouse(tx, {
        tenantId: tenant.id,
        warehouseId: shipment.warehouseId,
        inventoryItemId: line.inventoryItemId,
        quantity: line.quantityShipped,
        referenceId: shipment.id,
        createdById: session.user.id,
      });

      if (line.orderLineId) {
        await tx.orderLine.update({
          where: { id: line.orderLineId },
          data: {
            quantityShipped: { increment: line.quantityShipped },
          },
        });
      }
    }

    await tx.shipment.update({
      where: { id },
      data: {
        status: 'IN_TRANSIT',
        shippedAt: new Date(),
        shippedById: session.user.id,
      },
    });

    if (shipment.orderId) {
      await syncOrderStatusAfterShipment(tx, shipment.orderId);
    }
  });

  const shipped = await prisma.shipment.findUnique({
    where: { id },
    select: { number: true },
  });

  await logActivity({
    tenantId: tenant.id,
    userId: session.user.id,
    action: 'shipment.shipped',
    entityType: 'Shipment',
    entityId: id,
    metadata: { number: shipped?.number, status: 'IN_TRANSIT' },
  });

  revalidateShipmentPaths(id);
  redirect(`/dashboard/shipments/${id}`);
}

export async function deliverShipmentAction(id: string) {
  const { tenant } = await requireOperationsManager();

  const existing = await prisma.shipment.findFirst({
    where: { id, tenantId: tenant.id },
    select: { id: true, status: true },
  });

  if (!existing) {
    throw new Error('Shipment not found.');
  }

  if (existing.status !== 'IN_TRANSIT') {
    throw new Error('Only in-transit shipments can be marked delivered.');
  }

  await prisma.shipment.update({
    where: { id },
    data: { status: 'DELIVERED' },
  });

  revalidateShipmentPaths(id);
  redirect(`/dashboard/shipments/${id}`);
}

export async function cancelShipmentAction(id: string) {
  const { tenant } = await requireOperationsManager();

  const existing = await prisma.shipment.findFirst({
    where: { id, tenantId: tenant.id },
    select: { id: true, status: true },
  });

  if (!existing) {
    throw new Error('Shipment not found.');
  }

  if (existing.status !== 'DRAFT') {
    throw new Error('Only draft shipments can be cancelled.');
  }

  await prisma.shipment.update({
    where: { id },
    data: { status: 'CANCELLED' },
  });

  revalidateShipmentPaths(id);
  redirect(`/dashboard/shipments/${id}`);
}
