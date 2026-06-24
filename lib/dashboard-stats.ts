import prisma from '@/lib/prisma';

export async function getDashboardStats(tenantId: string) {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  const [
    activeWarehouses,
    inventoryItems,
    inventoryStocks,
    lowStockItems,
    pendingReceiving,
    openOrders,
    shipmentsToday,
  ] = await Promise.all([
    prisma.warehouse.count({
      where: { tenantId, isActive: true },
    }),
    prisma.inventoryItem.count({
      where: { tenantId, status: 'ACTIVE' },
    }),
    prisma.inventoryStock.findMany({
      where: { tenantId },
      select: {
        quantityOnHand: true,
        inventoryItem: {
          select: {
            reorderPoint: true,
          },
        },
      },
    }),
    prisma.inventoryItem.findMany({
      where: { tenantId, status: 'ACTIVE' },
      select: {
        id: true,
        reorderPoint: true,
        inventoryStocks: {
          select: { quantityOnHand: true },
        },
      },
    }),
    prisma.receiving.count({
      where: {
        tenantId,
        status: 'DRAFT',
      },
    }),
    prisma.order.count({
      where: {
        tenantId,
        status: { in: ['DRAFT', 'CONFIRMED', 'PICKING', 'PACKED'] },
      },
    }),
    prisma.shipment.count({
      where: {
        tenantId,
        shippedAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    }),
  ]);

  const totalOnHand = inventoryStocks.reduce(
    (total, stock) => total + stock.quantityOnHand,
    0
  );

  const lowStockCount = lowStockItems.filter((item) => {
    const onHand = item.inventoryStocks.reduce(
      (total, stock) => total + stock.quantityOnHand,
      0
    );

    return onHand <= item.reorderPoint;
  }).length;

  return {
    activeWarehouses,
    inventoryItems,
    totalOnHand,
    lowStockCount,
    pendingReceiving,
    openOrders,
    shipmentsToday,
  };
}
