import { z } from 'zod';

export const warehouseSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  code: z
    .string()
    .trim()
    .min(1, 'Code is required')
    .max(32, 'Code must be 32 characters or fewer')
    .regex(/^[A-Za-z0-9-_]+$/, 'Code can only contain letters, numbers, hyphens, and underscores'),
  address: z.string().trim().optional(),
  city: z.string().trim().optional(),
  state: z.string().trim().optional(),
  postalCode: z.string().trim().optional(),
  country: z.string().trim().optional(),
  isActive: z.boolean(),
});

export const stockLocationSchema = z.object({
  name: z.string().trim().min(1, 'Location name is required'),
  aisle: z.string().trim().optional(),
  rack: z.string().trim().optional(),
  bin: z.string().trim().optional(),
  isActive: z.boolean(),
});

export type WarehouseInput = z.infer<typeof warehouseSchema>;
export type StockLocationInput = z.infer<typeof stockLocationSchema>;

export type WarehouseListFilters = {
  q?: string;
  activeOnly?: boolean;
};

export function parseWarehouseListFilters(params: {
  q?: string;
  active?: string;
}): WarehouseListFilters {
  return {
    q: params.q?.trim() || undefined,
    activeOnly: params.active === 'true' ? true : undefined,
  };
}

export function formatBinLabel(location: {
  name: string;
  aisle?: string | null;
  rack?: string | null;
  bin?: string | null;
}) {
  const composed = [location.aisle, location.rack, location.bin]
    .filter(Boolean)
    .join('-');

  return composed || location.name;
}
