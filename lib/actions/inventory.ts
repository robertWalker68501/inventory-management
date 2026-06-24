'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { Prisma } from '@/app/generated/prisma/client';
import { logActivity } from '@/lib/activity-log';
import { canManageInventory } from '@/lib/permissions';
import prisma from '@/lib/prisma';
import { requireTenantContext } from '@/lib/tenant-context';
import { inventoryItemSchema } from '@/lib/validations/inventory';

async function requireInventoryManager() {
  const context = await requireTenantContext();

  if (!canManageInventory(context.role)) {
    throw new Error('You do not have permission to manage inventory.');
  }

  return context;
}

function revalidateInventoryPaths() {
  revalidatePath('/dashboard');
  revalidatePath('/dashboard/inventory');
  revalidatePath('/dashboard/stock');
  revalidatePath('/dashboard/reports');
}

export async function createInventoryItemAction(input: unknown) {
  const { tenant, session } = await requireInventoryManager();
  const data = inventoryItemSchema.parse(input);

  try {
    const item = await prisma.inventoryItem.create({
      data: {
        tenantId: tenant.id,
        sku: data.sku,
        name: data.name,
        description: data.description || null,
        category: data.category || null,
        unitOfMeasure: data.unitOfMeasure,
        reorderPoint: data.reorderPoint,
        barcode: data.barcode || null,
        status: data.status,
      },
    });

    await logActivity({
      tenantId: tenant.id,
      userId: session.user.id,
      action: 'inventory_item.created',
      entityType: 'InventoryItem',
      entityId: item.id,
      metadata: { sku: data.sku, name: data.name },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new Error('An item with this SKU already exists.');
    }

    throw error;
  }

  revalidateInventoryPaths();
  redirect('/dashboard/inventory');
}

export async function updateInventoryItemAction(id: string, input: unknown) {
  const { tenant, session } = await requireInventoryManager();
  const data = inventoryItemSchema.parse(input);

  const existing = await prisma.inventoryItem.findFirst({
    where: { id, tenantId: tenant.id },
    select: { id: true },
  });

  if (!existing) {
    throw new Error('Inventory item not found.');
  }

  try {
    await prisma.inventoryItem.update({
      where: { id },
      data: {
        sku: data.sku,
        name: data.name,
        description: data.description || null,
        category: data.category || null,
        unitOfMeasure: data.unitOfMeasure,
        reorderPoint: data.reorderPoint,
        barcode: data.barcode || null,
        status: data.status,
      },
    });

    await logActivity({
      tenantId: tenant.id,
      userId: session.user.id,
      action: 'inventory_item.updated',
      entityType: 'InventoryItem',
      entityId: id,
      metadata: { sku: data.sku, name: data.name },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new Error('An item with this SKU already exists.');
    }

    throw error;
  }

  revalidateInventoryPaths();
  redirect('/dashboard/inventory');
}

export async function deleteInventoryItemAction(id: string) {
  const { tenant, session } = await requireInventoryManager();

  const existing = await prisma.inventoryItem.findFirst({
    where: { id, tenantId: tenant.id },
    select: { id: true, sku: true, name: true },
  });

  if (!existing) {
    throw new Error('Inventory item not found.');
  }

  await prisma.inventoryItem.delete({
    where: { id },
  });

  await logActivity({
    tenantId: tenant.id,
    userId: session.user.id,
    action: 'inventory_item.deleted',
    entityType: 'InventoryItem',
    entityId: id,
    metadata: { sku: existing.sku, name: existing.name },
  });

  revalidateInventoryPaths();
  redirect('/dashboard/inventory');
}
