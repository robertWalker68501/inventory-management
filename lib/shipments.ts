import type { Shipment } from '@/app/generated/prisma/client';
import prisma from '@/lib/prisma';
import type { ShipmentListFilters } from '@/lib/validations/operations';

export type ShipmentListItem = Shipment & {
  warehouseName: string;
  warehouseCode: string;
  orderNumber: string | null;
  lineCount: number;
  totalShipped: number;
};

export type ShipmentDetail = Shipment & {
  warehouse: { id: string; name: string; code: string };
  order: { id: string; number: string; status: string } | null;
  lines: {
    id: string;
    orderLineId: string | null;
    inventoryItemId: string;
    quantityShipped: number;
    inventoryItem: {
      id: string;
      sku: string;
      name: string;
      unitOfMeasure: string;
    };
  }[];
};

export async function listShipments(
  tenantId: string,
  filters: ShipmentListFilters = {}
) {
  const shipments = await prisma.shipment.findMany({
    where: {
      tenantId,
      ...(filters.status && filters.status !== 'ALL'
        ? { status: filters.status }
        : {}),
      ...(filters.q
        ? {
            OR: [
              { number: { contains: filters.q, mode: 'insensitive' } },
              { trackingNumber: { contains: filters.q, mode: 'insensitive' } },
              { notes: { contains: filters.q, mode: 'insensitive' } },
              { warehouse: { name: { contains: filters.q, mode: 'insensitive' } } },
              { order: { number: { contains: filters.q, mode: 'insensitive' } } },
            ],
          }
        : {}),
    },
    include: {
      warehouse: { select: { name: true, code: true } },
      order: { select: { number: true } },
      lines: { select: { quantityShipped: true } },
    },
    orderBy: [{ createdAt: 'desc' }],
  });

  return shipments.map((shipment) => ({
    ...shipment,
    warehouseName: shipment.warehouse.name,
    warehouseCode: shipment.warehouse.code,
    orderNumber: shipment.order?.number ?? null,
    lineCount: shipment.lines.length,
    totalShipped: shipment.lines.reduce(
      (sum, line) => sum + line.quantityShipped,
      0
    ),
  })) satisfies ShipmentListItem[];
}

export async function getShipment(tenantId: string, id: string) {
  return prisma.shipment.findFirst({
    where: { id, tenantId },
    include: {
      warehouse: { select: { id: true, name: true, code: true } },
      order: { select: { id: true, number: true, status: true } },
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
    },
  });
}

export async function listActiveWarehouses(tenantId: string) {
  return prisma.warehouse.findMany({
    where: { tenantId, isActive: true },
    select: { id: true, name: true, code: true },
    orderBy: { name: 'asc' },
  });
}

export async function listActiveInventoryItems(tenantId: string) {
  return prisma.inventoryItem.findMany({
    where: { tenantId, status: 'ACTIVE' },
    select: {
      id: true,
      sku: true,
      name: true,
      unitOfMeasure: true,
    },
    orderBy: { name: 'asc' },
  });
}
