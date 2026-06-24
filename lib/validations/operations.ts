import { z } from 'zod';

export const purchaseOrderStatuses = [
  'DRAFT',
  'SUBMITTED',
  'PARTIALLY_RECEIVED',
  'RECEIVED',
  'CANCELLED',
] as const;

export const receivingStatuses = [
  'DRAFT',
  'COMPLETED',
  'CANCELLED',
] as const;

export const orderStatuses = [
  'DRAFT',
  'CONFIRMED',
  'PICKING',
  'PACKED',
  'SHIPPED',
  'CANCELLED',
] as const;

export const shipmentStatuses = [
  'DRAFT',
  'IN_TRANSIT',
  'DELIVERED',
  'CANCELLED',
] as const;

export const supplierSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  email: z
    .string()
    .trim()
    .refine((value) => value === '' || z.string().email().safeParse(value).success, {
      message: 'Enter a valid email',
    })
    .optional(),
  phone: z.string().trim().optional(),
  address: z.string().trim().optional(),
  notes: z.string().trim().optional(),
  isActive: z.boolean(),
});

export type SupplierInput = z.infer<typeof supplierSchema>;

export const purchaseOrderLineSchema = z.object({
  inventoryItemId: z.string().min(1, 'Item is required'),
  quantityOrdered: z.number().int().min(1, 'Quantity must be at least 1'),
  unitCost: z.number().min(0, 'Unit cost must be 0 or greater').optional(),
});

export const purchaseOrderSchema = z.object({
  supplierId: z.string().min(1, 'Supplier is required'),
  expectedAt: z.string().optional(),
  notes: z.string().trim().optional(),
  lines: z.array(purchaseOrderLineSchema).min(1, 'Add at least one line item'),
});

export type PurchaseOrderInput = z.infer<typeof purchaseOrderSchema>;

export const receivingLineSchema = z.object({
  inventoryItemId: z.string().min(1, 'Item is required'),
  purchaseOrderLineId: z.string().optional(),
  stockLocationId: z.string().optional(),
  quantityReceived: z.number().int().min(0, 'Quantity must be 0 or greater'),
});

export const receivingSchema = z.object({
  warehouseId: z.string().min(1, 'Warehouse is required'),
  purchaseOrderId: z.string().optional(),
  notes: z.string().trim().optional(),
  lines: z.array(receivingLineSchema).min(1, 'Add at least one line item'),
});

export type ReceivingInput = z.infer<typeof receivingSchema>;

export const orderLineSchema = z.object({
  inventoryItemId: z.string().min(1, 'Item is required'),
  quantityOrdered: z.number().int().min(1, 'Quantity must be at least 1'),
});

export const orderSchema = z.object({
  notes: z.string().trim().optional(),
  lines: z.array(orderLineSchema).min(1, 'Add at least one line item'),
});

export type OrderInput = z.infer<typeof orderSchema>;

export const pickOrderLineSchema = z.object({
  orderLineId: z.string().min(1),
  quantityPicked: z.number().int().min(0),
});

export const pickOrderSchema = z.object({
  lines: z.array(pickOrderLineSchema).min(1),
});

export type PickOrderInput = z.infer<typeof pickOrderSchema>;

export const shipmentLineSchema = z.object({
  orderLineId: z.string().optional(),
  inventoryItemId: z.string().min(1, 'Item is required'),
  quantityShipped: z.number().int().min(0, 'Quantity must be 0 or greater'),
});

export const shipmentSchema = z.object({
  orderId: z.string().optional(),
  warehouseId: z.string().min(1, 'Warehouse is required'),
  trackingNumber: z.string().trim().optional(),
  notes: z.string().trim().optional(),
  lines: z.array(shipmentLineSchema).min(1, 'Add at least one line item'),
});

export type ShipmentInput = z.infer<typeof shipmentSchema>;

export type SupplierListFilters = {
  q?: string;
  activeOnly?: boolean;
};

export function parseSupplierListFilters(params: {
  q?: string;
  active?: string;
}): SupplierListFilters {
  return {
    q: params.q?.trim() || undefined,
    activeOnly: params.active === 'true' ? true : undefined,
  };
}

export type PurchaseOrderListFilters = {
  q?: string;
  status?: (typeof purchaseOrderStatuses)[number] | 'ALL';
};

export function parsePurchaseOrderListFilters(params: {
  q?: string;
  status?: string;
}): PurchaseOrderListFilters {
  const status =
    params.status &&
    (purchaseOrderStatuses as readonly string[]).includes(params.status)
      ? (params.status as PurchaseOrderListFilters['status'])
      : params.status === 'ALL'
        ? 'ALL'
        : undefined;

  return {
    q: params.q?.trim() || undefined,
    status: status ?? 'ALL',
  };
}

export type ReceivingListFilters = {
  q?: string;
  status?: (typeof receivingStatuses)[number] | 'ALL';
};

export function parseReceivingListFilters(params: {
  q?: string;
  status?: string;
}): ReceivingListFilters {
  const status =
    params.status &&
    (receivingStatuses as readonly string[]).includes(params.status)
      ? (params.status as ReceivingListFilters['status'])
      : params.status === 'ALL'
        ? 'ALL'
        : undefined;

  return {
    q: params.q?.trim() || undefined,
    status: status ?? 'ALL',
  };
}

export type OrderListFilters = {
  q?: string;
  status?: (typeof orderStatuses)[number] | 'ALL';
};

export function parseOrderListFilters(params: {
  q?: string;
  status?: string;
}): OrderListFilters {
  const status =
    params.status &&
    (orderStatuses as readonly string[]).includes(params.status)
      ? (params.status as OrderListFilters['status'])
      : params.status === 'ALL'
        ? 'ALL'
        : undefined;

  return {
    q: params.q?.trim() || undefined,
    status: status ?? 'ALL',
  };
}

export type ShipmentListFilters = {
  q?: string;
  status?: (typeof shipmentStatuses)[number] | 'ALL';
};

export function parseShipmentListFilters(params: {
  q?: string;
  status?: string;
}): ShipmentListFilters {
  const status =
    params.status &&
    (shipmentStatuses as readonly string[]).includes(params.status)
      ? (params.status as ShipmentListFilters['status'])
      : params.status === 'ALL'
        ? 'ALL'
        : undefined;

  return {
    q: params.q?.trim() || undefined,
    status: status ?? 'ALL',
  };
}
