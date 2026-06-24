import type { StockLocation, Warehouse } from '@/app/generated/prisma/client';
import prisma from '@/lib/prisma';
import type { WarehouseListFilters } from '@/lib/validations/warehouse';

export type WarehouseWithCounts = Warehouse & {
  locationCount: number;
  stockLineCount: number;
  totalOnHand: number;
};

export type WarehouseDetail = Warehouse & {
  locationCount: number;
  stockLineCount: number;
  totalOnHand: number;
  stockLocations: StockLocationWithStock[];
};

export type StockLocationWithStock = StockLocation & {
  stockLineCount: number;
  totalOnHand: number;
  totalReserved: number;
};

export async function listWarehouses(
  tenantId: string,
  filters: WarehouseListFilters = {}
) {
  const warehouses = await prisma.warehouse.findMany({
    where: {
      tenantId,
      ...(filters.activeOnly ? { isActive: true } : {}),
      ...(filters.q
        ? {
            OR: [
              { name: { contains: filters.q, mode: 'insensitive' } },
              { code: { contains: filters.q, mode: 'insensitive' } },
              { city: { contains: filters.q, mode: 'insensitive' } },
              { state: { contains: filters.q, mode: 'insensitive' } },
            ],
          }
        : {}),
    },
    include: {
      stockLocations: {
        include: {
          inventoryStocks: {
            select: {
              quantityOnHand: true,
            },
          },
        },
      },
    },
    orderBy: [{ name: 'asc' }],
  });

  return warehouses.map((warehouse) => {
    const stockLocations = warehouse.stockLocations;
    const stockLineCount = stockLocations.reduce(
      (total, location) => total + location.inventoryStocks.length,
      0
    );
    const totalOnHand = stockLocations.reduce(
      (total, location) =>
        total +
        location.inventoryStocks.reduce(
          (locationTotal, stock) => locationTotal + stock.quantityOnHand,
          0
        ),
      0
    );

    const { stockLocations: _stockLocations, ...rest } = warehouse;

    return {
      ...rest,
      locationCount: stockLocations.length,
      stockLineCount,
      totalOnHand,
    } satisfies WarehouseWithCounts;
  });
}

export async function getWarehouse(tenantId: string, id: string) {
  const warehouse = await prisma.warehouse.findFirst({
    where: { id, tenantId },
    include: {
      stockLocations: {
        include: {
          inventoryStocks: {
            select: {
              quantityOnHand: true,
              quantityReserved: true,
            },
          },
        },
        orderBy: [{ name: 'asc' }],
      },
    },
  });

  if (!warehouse) {
    return null;
  }

  const stockLocations = warehouse.stockLocations.map((location) => ({
    ...location,
    stockLineCount: location.inventoryStocks.length,
    totalOnHand: location.inventoryStocks.reduce(
      (total, stock) => total + stock.quantityOnHand,
      0
    ),
    totalReserved: location.inventoryStocks.reduce(
      (total, stock) => total + stock.quantityReserved,
      0
    ),
  }));

  const stockLineCount = stockLocations.reduce(
    (total, location) => total + location.stockLineCount,
    0
  );
  const totalOnHand = stockLocations.reduce(
    (total, location) => total + location.totalOnHand,
    0
  );

  const { stockLocations: _stockLocations, ...rest } = warehouse;

  return {
    ...rest,
    locationCount: stockLocations.length,
    stockLineCount,
    totalOnHand,
    stockLocations,
  } satisfies WarehouseDetail;
}

export async function getStockLocation(
  tenantId: string,
  warehouseId: string,
  locationId: string
) {
  return prisma.stockLocation.findFirst({
    where: {
      id: locationId,
      tenantId,
      warehouseId,
    },
    include: {
      inventoryStocks: {
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
      },
    },
  });
}
