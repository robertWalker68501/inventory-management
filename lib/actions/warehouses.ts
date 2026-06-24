'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { Prisma } from '@/app/generated/prisma/client';
import { canManageWarehouses } from '@/lib/permissions';
import prisma from '@/lib/prisma';
import { requireTenantContext } from '@/lib/tenant-context';
import {
  stockLocationSchema,
  warehouseSchema,
} from '@/lib/validations/warehouse';

async function requireWarehouseManager() {
  const context = await requireTenantContext();

  if (!canManageWarehouses(context.role)) {
    throw new Error('You do not have permission to manage warehouses.');
  }

  return context;
}

function revalidateWarehousePaths(warehouseId?: string) {
  revalidatePath('/dashboard');
  revalidatePath('/dashboard/warehouses');
  revalidatePath('/dashboard/stock');

  if (warehouseId) {
    revalidatePath(`/dashboard/warehouses/${warehouseId}`);
  }
}

async function assertWarehouseBelongsToTenant(tenantId: string, warehouseId: string) {
  const warehouse = await prisma.warehouse.findFirst({
    where: { id: warehouseId, tenantId },
    select: { id: true },
  });

  if (!warehouse) {
    throw new Error('Warehouse not found.');
  }

  return warehouse;
}

export async function createWarehouseAction(input: unknown) {
  const { tenant } = await requireWarehouseManager();
  const data = warehouseSchema.parse(input);

  try {
    const warehouse = await prisma.warehouse.create({
      data: {
        tenantId: tenant.id,
        name: data.name,
        code: data.code.toUpperCase(),
        address: data.address || null,
        city: data.city || null,
        state: data.state || null,
        postalCode: data.postalCode || null,
        country: data.country || null,
        isActive: data.isActive,
      },
    });

    revalidateWarehousePaths();
    redirect(`/dashboard/warehouses/${warehouse.id}`);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new Error('A warehouse with this code already exists.');
    }

    throw error;
  }
}

export async function updateWarehouseAction(id: string, input: unknown) {
  const { tenant } = await requireWarehouseManager();
  const data = warehouseSchema.parse(input);

  await assertWarehouseBelongsToTenant(tenant.id, id);

  try {
    await prisma.warehouse.update({
      where: { id },
      data: {
        name: data.name,
        code: data.code.toUpperCase(),
        address: data.address || null,
        city: data.city || null,
        state: data.state || null,
        postalCode: data.postalCode || null,
        country: data.country || null,
        isActive: data.isActive,
      },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new Error('A warehouse with this code already exists.');
    }

    throw error;
  }

  revalidateWarehousePaths(id);
  redirect(`/dashboard/warehouses/${id}`);
}

export async function deleteWarehouseAction(id: string) {
  const { tenant } = await requireWarehouseManager();
  await assertWarehouseBelongsToTenant(tenant.id, id);

  const stockCount = await prisma.inventoryStock.count({
    where: {
      tenantId: tenant.id,
      stockLocation: { warehouseId: id },
    },
  });

  if (stockCount > 0) {
    throw new Error(
      'Cannot delete a warehouse that still has inventory stock assigned.'
    );
  }

  await prisma.warehouse.delete({ where: { id } });

  revalidateWarehousePaths();
  redirect('/dashboard/warehouses');
}

export async function createStockLocationAction(
  warehouseId: string,
  input: unknown
) {
  const { tenant } = await requireWarehouseManager();
  const data = stockLocationSchema.parse(input);

  await assertWarehouseBelongsToTenant(tenant.id, warehouseId);

  try {
    await prisma.stockLocation.create({
      data: {
        tenantId: tenant.id,
        warehouseId,
        name: data.name,
        aisle: data.aisle || null,
        rack: data.rack || null,
        bin: data.bin || null,
        isActive: data.isActive,
      },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new Error('A stock location with this name already exists.');
    }

    throw error;
  }

  revalidateWarehousePaths(warehouseId);
  redirect(`/dashboard/warehouses/${warehouseId}`);
}

export async function updateStockLocationAction(
  warehouseId: string,
  locationId: string,
  input: unknown
) {
  const { tenant } = await requireWarehouseManager();
  const data = stockLocationSchema.parse(input);

  await assertWarehouseBelongsToTenant(tenant.id, warehouseId);

  const existing = await prisma.stockLocation.findFirst({
    where: { id: locationId, tenantId: tenant.id, warehouseId },
    select: { id: true },
  });

  if (!existing) {
    throw new Error('Stock location not found.');
  }

  try {
    await prisma.stockLocation.update({
      where: { id: locationId },
      data: {
        name: data.name,
        aisle: data.aisle || null,
        rack: data.rack || null,
        bin: data.bin || null,
        isActive: data.isActive,
      },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new Error('A stock location with this name already exists.');
    }

    throw error;
  }

  revalidateWarehousePaths(warehouseId);
  redirect(`/dashboard/warehouses/${warehouseId}`);
}

export async function deleteStockLocationAction(
  warehouseId: string,
  locationId: string
) {
  const { tenant } = await requireWarehouseManager();
  await assertWarehouseBelongsToTenant(tenant.id, warehouseId);

  const stockCount = await prisma.inventoryStock.count({
    where: {
      tenantId: tenant.id,
      stockLocationId: locationId,
    },
  });

  if (stockCount > 0) {
    throw new Error(
      'Cannot delete a location that still has inventory stock assigned.'
    );
  }

  await prisma.stockLocation.delete({ where: { id: locationId } });

  revalidateWarehousePaths(warehouseId);
  redirect(`/dashboard/warehouses/${warehouseId}`);
}
