import type { Order } from '@/app/generated/prisma/client';
import prisma from '@/lib/prisma';
import type { OrderListFilters } from '@/lib/validations/operations';

export type OrderListItem = Order & {
  lineCount: number;
  totalOrdered: number;
  totalPicked: number;
  totalShipped: number;
};

export type OrderDetail = Order & {
  lines: {
    id: string;
    inventoryItemId: string;
    quantityOrdered: number;
    quantityPicked: number;
    quantityShipped: number;
    inventoryItem: {
      id: string;
      sku: string;
      name: string;
      unitOfMeasure: string;
    };
  }[];
  shipments: {
    id: string;
    number: string;
    status: string;
    shippedAt: Date | null;
  }[];
};

export async function listOrders(tenantId: string, filters: OrderListFilters = {}) {
  const orders = await prisma.order.findMany({
    where: {
      tenantId,
      ...(filters.status && filters.status !== 'ALL'
        ? { status: filters.status }
        : {}),
      ...(filters.q
        ? {
            OR: [
              { number: { contains: filters.q, mode: 'insensitive' } },
              { notes: { contains: filters.q, mode: 'insensitive' } },
            ],
          }
        : {}),
    },
    include: {
      lines: {
        select: {
          quantityOrdered: true,
          quantityPicked: true,
          quantityShipped: true,
        },
      },
    },
    orderBy: [{ createdAt: 'desc' }],
  });

  return orders.map((order) => {
    const totalOrdered = order.lines.reduce(
      (sum, line) => sum + line.quantityOrdered,
      0
    );
    const totalPicked = order.lines.reduce(
      (sum, line) => sum + line.quantityPicked,
      0
    );
    const totalShipped = order.lines.reduce(
      (sum, line) => sum + line.quantityShipped,
      0
    );

    return {
      ...order,
      lineCount: order.lines.length,
      totalOrdered,
      totalPicked,
      totalShipped,
    } satisfies OrderListItem;
  });
}

export async function getOrder(tenantId: string, id: string) {
  return prisma.order.findFirst({
    where: { id, tenantId },
    include: {
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
      shipments: {
        select: {
          id: true,
          number: true,
          status: true,
          shippedAt: true,
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  });
}

export async function getShippableOrders(tenantId: string) {
  return prisma.order.findMany({
    where: {
      tenantId,
      status: { in: ['CONFIRMED', 'PICKING', 'PACKED'] },
    },
    select: {
      id: true,
      number: true,
      status: true,
      lines: {
        select: {
          id: true,
          inventoryItemId: true,
          quantityOrdered: true,
          quantityPicked: true,
          quantityShipped: true,
          inventoryItem: {
            select: { sku: true, name: true, unitOfMeasure: true },
          },
        },
      },
    },
    orderBy: { number: 'asc' },
  });
}
