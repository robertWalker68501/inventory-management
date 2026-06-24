import type { InventoryItem, InventoryStock } from '@/app/generated/prisma/client';
import prisma from '@/lib/prisma';
import type { InventoryListFilters } from '@/lib/validations/inventory';

export type InventoryItemWithStock = InventoryItem & {
  quantityOnHand: number;
  quantityReserved: number;
  quantityAvailable: number;
  quantityIncoming: number;
  isLowStock: boolean;
};

function summarizeStock(
  stocks: Pick<
    InventoryStock,
    'quantityOnHand' | 'quantityReserved' | 'quantityIncoming'
  >[],
  reorderPoint: number
) {
  const quantityOnHand = stocks.reduce(
    (total, stock) => total + stock.quantityOnHand,
    0
  );
  const quantityReserved = stocks.reduce(
    (total, stock) => total + stock.quantityReserved,
    0
  );
  const quantityIncoming = stocks.reduce(
    (total, stock) => total + stock.quantityIncoming,
    0
  );

  return {
    quantityOnHand,
    quantityReserved,
    quantityAvailable: quantityOnHand - quantityReserved,
    quantityIncoming,
    isLowStock: quantityOnHand <= reorderPoint,
  };
}

function enrichInventoryItem(
  item: InventoryItem & { inventoryStocks: InventoryStock[] }
): InventoryItemWithStock {
  const stock = summarizeStock(item.inventoryStocks, item.reorderPoint);

  return {
    ...item,
    ...stock,
  };
}

export async function listInventoryItems(
  tenantId: string,
  filters: InventoryListFilters = {}
) {
  const items = await prisma.inventoryItem.findMany({
    where: {
      tenantId,
      ...(filters.status && filters.status !== 'ALL'
        ? { status: filters.status }
        : {}),
      ...(filters.q
        ? {
            OR: [
              { sku: { contains: filters.q, mode: 'insensitive' } },
              { name: { contains: filters.q, mode: 'insensitive' } },
              { category: { contains: filters.q, mode: 'insensitive' } },
              { barcode: { contains: filters.q, mode: 'insensitive' } },
            ],
          }
        : {}),
    },
    include: {
      inventoryStocks: true,
    },
    orderBy: [{ name: 'asc' }],
  });

  const enriched = items.map(enrichInventoryItem);

  if (filters.lowStock) {
    return enriched.filter((item) => item.isLowStock && item.status === 'ACTIVE');
  }

  return enriched;
}

export async function getInventoryItem(tenantId: string, id: string) {
  const item = await prisma.inventoryItem.findFirst({
    where: { id, tenantId },
    include: {
      inventoryStocks: true,
    },
  });

  if (!item) {
    return null;
  }

  return enrichInventoryItem(item);
}

export async function getLowStockItems(tenantId: string) {
  const items = await listInventoryItems(tenantId, { status: 'ACTIVE' });
  return items.filter((item) => item.isLowStock);
}

export async function getInventoryCategories(tenantId: string) {
  const categories = await prisma.inventoryItem.findMany({
    where: {
      tenantId,
      category: { not: null },
    },
    select: { category: true },
    distinct: ['category'],
    orderBy: { category: 'asc' },
  });

  return categories
    .map((item) => item.category)
    .filter((category): category is string => Boolean(category));
}
