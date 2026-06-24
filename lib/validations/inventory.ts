import { z } from 'zod';

export const inventoryItemStatuses = [
  'ACTIVE',
  'INACTIVE',
  'DISCONTINUED',
] as const;

export const inventoryItemSchema = z.object({
  sku: z.string().trim().min(1, 'SKU is required'),
  name: z.string().trim().min(1, 'Name is required'),
  description: z.string().trim().optional(),
  category: z.string().trim().optional(),
  unitOfMeasure: z.string().trim().min(1, 'Unit of measure is required'),
  reorderPoint: z.number().int().min(0, 'Reorder point must be 0 or greater'),
  barcode: z.string().trim().optional(),
  status: z.enum(inventoryItemStatuses),
});

export type InventoryItemInput = z.infer<typeof inventoryItemSchema>;

export type InventoryListFilters = {
  q?: string;
  status?: (typeof inventoryItemStatuses)[number] | 'ALL';
  lowStock?: boolean;
};

export function parseInventoryListFilters(params: {
  q?: string;
  status?: string;
  lowStock?: string;
}): InventoryListFilters {
  const status =
    params.status &&
    (inventoryItemStatuses as readonly string[]).includes(params.status)
      ? (params.status as InventoryListFilters['status'])
      : params.status === 'ALL'
        ? 'ALL'
        : undefined;

  return {
    q: params.q?.trim() || undefined,
    status: status ?? 'ALL',
    lowStock: params.lowStock === 'true' ? true : undefined,
  };
}
