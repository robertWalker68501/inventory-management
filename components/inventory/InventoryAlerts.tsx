import Link from 'next/link';
import { AlertTriangle, Package } from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import type { InventoryItemWithStock } from '@/lib/inventory';

type LowStockAlertProps = {
  items: InventoryItemWithStock[];
};

export function LowStockAlert({ items }: LowStockAlertProps) {
  if (items.length === 0) {
    return null;
  }

  const preview = items.slice(0, 3).map((item) => item.name).join(', ');
  const remainder = items.length > 3 ? ` and ${items.length - 3} more` : '';

  return (
    <Alert variant='destructive'>
      <AlertTriangle />
      <AlertTitle>Low stock alert</AlertTitle>
      <AlertDescription className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
        <span>
          {items.length} active item{items.length === 1 ? '' : 's'} at or below
          reorder point: {preview}
          {remainder}.
        </span>
        <Button
          size='sm'
          variant='outline'
          asChild
        >
          <Link href='/dashboard/inventory?lowStock=true'>View low stock</Link>
        </Button>
      </AlertDescription>
    </Alert>
  );
}

export function InventoryEmptyState({
  canManage,
  hasFilters,
}: {
  canManage: boolean;
  hasFilters: boolean;
}) {
  return (
    <div className='flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed px-6 py-16 text-center'>
      <div className='flex size-12 items-center justify-center rounded-lg bg-muted'>
        <Package className='size-6' />
      </div>
      <div className='space-y-1'>
        <h2 className='font-heading text-lg font-medium'>
          {hasFilters ? 'No items match your filters' : 'No inventory items yet'}
        </h2>
        <p className='max-w-md text-sm text-muted-foreground'>
          {hasFilters
            ? 'Try adjusting your search or filters to find inventory items.'
            : 'Create your first SKU to start tracking stock across warehouses.'}
        </p>
      </div>
      {canManage && !hasFilters ? (
        <Button asChild>
          <Link href='/dashboard/inventory/new'>Add inventory item</Link>
        </Button>
      ) : null}
    </div>
  );
}
