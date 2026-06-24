import type { PurchaseOrder } from '@/app/generated/prisma/client';
import prisma from '@/lib/prisma';
import type { PurchaseOrderListFilters } from '@/lib/validations/operations';

export type PurchaseOrderLineDetail = {
  id: string;
  inventoryItemId: string;
  quantityOrdered: number;
  quantityReceived: number;
  unitCost: string | null;
  inventoryItem: {
    id: string;
    sku: string;
    name: string;
    unitOfMeasure: string;
  };
};

export type PurchaseOrderListItem = PurchaseOrder & {
  supplierName: string;
  lineCount: number;
  totalOrdered: number;
  totalReceived: number;
};

export type PurchaseOrderDetail = PurchaseOrder & {
  supplier: { id: string; name: string };
  lines: PurchaseOrderLineDetail[];
  receivings: {
    id: string;
    number: string;
    status: string;
    receivedAt: Date | null;
  }[];
};

export async function listPurchaseOrders(
  tenantId: string,
  filters: PurchaseOrderListFilters = {}
) {
  const orders = await prisma.purchaseOrder.findMany({
    where: {
      tenantId,
      ...(filters.status && filters.status !== 'ALL'
        ? { status: filters.status }
        : {}),
      ...(filters.q
        ? {
            OR: [
              { number: { contains: filters.q, mode: 'insensitive' } },
              { supplier: { name: { contains: filters.q, mode: 'insensitive' } } },
              { notes: { contains: filters.q, mode: 'insensitive' } },
            ],
          }
        : {}),
    },
    include: {
      supplier: { select: { name: true } },
      lines: { select: { quantityOrdered: true, quantityReceived: true } },
    },
    orderBy: [{ createdAt: 'desc' }],
  });

  return orders.map((order) => {
    const totalOrdered = order.lines.reduce(
      (sum, line) => sum + line.quantityOrdered,
      0
    );
    const totalReceived = order.lines.reduce(
      (sum, line) => sum + line.quantityReceived,
      0
    );

    return {
      ...order,
      supplierName: order.supplier.name,
      lineCount: order.lines.length,
      totalOrdered,
      totalReceived,
    } satisfies PurchaseOrderListItem;
  });
}

export async function getPurchaseOrder(tenantId: string, id: string) {
  const order = await prisma.purchaseOrder.findFirst({
    where: { id, tenantId },
    include: {
      supplier: { select: { id: true, name: true } },
      lines: {
        include: {
          inventoryItem: {
            select: {
              id: true,
              sku: true,
              name: true,
              unitOfMeasure: true,
            },
          },
        },
        orderBy: { createdAt: 'asc' },
      },
      receivings: {
        select: {
          id: true,
          number: true,
          status: true,
          receivedAt: true,
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!order) {
    return null;
  }

  return {
    ...order,
    lines: order.lines.map((line) => ({
      ...line,
      unitCost: line.unitCost?.toString() ?? null,
    })),
  } satisfies PurchaseOrderDetail;
}

export async function getOpenPurchaseOrders(tenantId: string) {
  return prisma.purchaseOrder.findMany({
    where: {
      tenantId,
      status: { in: ['SUBMITTED', 'PARTIALLY_RECEIVED'] },
    },
    select: {
      id: true,
      number: true,
      supplier: { select: { name: true } },
      lines: {
        select: {
          id: true,
          inventoryItemId: true,
          quantityOrdered: true,
          quantityReceived: true,
          inventoryItem: {
            select: { sku: true, name: true, unitOfMeasure: true },
          },
        },
      },
    },
    orderBy: { number: 'asc' },
  });
}
