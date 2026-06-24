import type { Supplier } from '@/app/generated/prisma/client';
import prisma from '@/lib/prisma';
import type { SupplierListFilters } from '@/lib/validations/operations';

export type SupplierWithCounts = Supplier & {
  purchaseOrderCount: number;
};

export async function listSuppliers(
  tenantId: string,
  filters: SupplierListFilters = {}
) {
  const suppliers = await prisma.supplier.findMany({
    where: {
      tenantId,
      ...(filters.activeOnly ? { isActive: true } : {}),
      ...(filters.q
        ? {
            OR: [
              { name: { contains: filters.q, mode: 'insensitive' } },
              { email: { contains: filters.q, mode: 'insensitive' } },
              { phone: { contains: filters.q, mode: 'insensitive' } },
            ],
          }
        : {}),
    },
    include: {
      _count: { select: { purchaseOrders: true } },
    },
    orderBy: [{ name: 'asc' }],
  });

  return suppliers.map(({ _count, ...supplier }) => ({
    ...supplier,
    purchaseOrderCount: _count.purchaseOrders,
  })) satisfies SupplierWithCounts[];
}

export async function getSupplier(tenantId: string, id: string) {
  return prisma.supplier.findFirst({
    where: { id, tenantId },
    include: {
      _count: { select: { purchaseOrders: true } },
      purchaseOrders: {
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          number: true,
          status: true,
          orderedAt: true,
          expectedAt: true,
        },
      },
    },
  });
}

export async function listActiveSuppliers(tenantId: string) {
  return prisma.supplier.findMany({
    where: { tenantId, isActive: true },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  });
}
