import type { Receiving } from '@/app/generated/prisma/client';
import prisma from '@/lib/prisma';
import type { ReceivingListFilters } from '@/lib/validations/operations';

export type ReceivingListItem = Receiving & {
  warehouseName: string;
  warehouseCode: string;
  purchaseOrderNumber: string | null;
  lineCount: number;
  totalReceived: number;
};

export type ReceivingDetail = Receiving & {
  warehouse: { id: string; name: string; code: string };
  purchaseOrder: {
    id: string;
    number: string;
    status: string;
  } | null;
  lines: {
    id: string;
    inventoryItemId: string;
    purchaseOrderLineId: string | null;
    stockLocationId: string | null;
    quantityReceived: number;
    inventoryItem: {
      id: string;
      sku: string;
      name: string;
      unitOfMeasure: string;
    };
    stockLocation: {
      id: string;
      name: string;
    } | null;
  }[];
};

export async function listReceivings(
  tenantId: string,
  filters: ReceivingListFilters = {}
) {
  const receivings = await prisma.receiving.findMany({
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
              { warehouse: { name: { contains: filters.q, mode: 'insensitive' } } },
              {
                purchaseOrder: {
                  number: { contains: filters.q, mode: 'insensitive' },
                },
              },
            ],
          }
        : {}),
    },
    include: {
      warehouse: { select: { name: true, code: true } },
      purchaseOrder: { select: { number: true } },
      lines: { select: { quantityReceived: true } },
    },
    orderBy: [{ createdAt: 'desc' }],
  });

  return receivings.map((receiving) => ({
    ...receiving,
    warehouseName: receiving.warehouse.name,
    warehouseCode: receiving.warehouse.code,
    purchaseOrderNumber: receiving.purchaseOrder?.number ?? null,
    lineCount: receiving.lines.length,
    totalReceived: receiving.lines.reduce(
      (sum, line) => sum + line.quantityReceived,
      0
    ),
  })) satisfies ReceivingListItem[];
}

export async function getReceiving(tenantId: string, id: string) {
  const receiving = await prisma.receiving.findFirst({
    where: { id, tenantId },
    include: {
      warehouse: { select: { id: true, name: true, code: true } },
      purchaseOrder: { select: { id: true, number: true, status: true } },
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
          stockLocation: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  return receiving;
}

export async function listStockLocationsForWarehouse(
  tenantId: string,
  warehouseId: string
) {
  return prisma.stockLocation.findMany({
    where: { tenantId, warehouseId, isActive: true },
    select: { id: true, name: true, aisle: true, rack: true, bin: true },
    orderBy: { name: 'asc' },
  });
}

export async function listAllStockLocations(tenantId: string) {
  return prisma.stockLocation.findMany({
    where: { tenantId, isActive: true },
    select: { id: true, name: true, warehouseId: true },
    orderBy: { name: 'asc' },
  });
}
