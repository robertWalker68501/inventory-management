import Link from 'next/link';
import { Suspense } from 'react';

import {
  InventoryEmptyState,
  LowStockAlert,
} from '@/components/inventory/InventoryAlerts';
import { InventoryFilters } from '@/components/inventory/InventoryFilters';
import { InventoryTable } from '@/components/inventory/InventoryTable';
import { DashboardPageHeader } from '@/components/dashboard/DashboardPageHeader';
import { Button } from '@/components/ui/button';
import { getLowStockItems, listInventoryItems } from '@/lib/inventory';
import { canManageInventory } from '@/lib/permissions';
import { requireTenantContext } from '@/lib/tenant-context';
import { parseInventoryListFilters } from '@/lib/validations/inventory';

type InventoryPageProps = {
  searchParams: Promise<{
    q?: string;
    status?: string;
    lowStock?: string;
  }>;
};

export default async function InventoryPage({ searchParams }: InventoryPageProps) {
  const { tenant, role } = await requireTenantContext();
  const params = await searchParams;
  const filters = parseInventoryListFilters(params);

  const [items, lowStockItems] = await Promise.all([
    listInventoryItems(tenant.id, filters),
    getLowStockItems(tenant.id),
  ]);

  const canManage = canManageInventory(role);
  const hasFilters = Boolean(
    filters.q || (filters.status && filters.status !== 'ALL') || filters.lowStock
  );

  return (
    <div className='flex flex-col gap-6'>
      <div className='flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between'>
        <DashboardPageHeader
          title='Inventory'
          description='Manage SKU catalog, replenishment settings, and stock alerts.'
        />
        {canManage ? (
          <Button
            asChild
            className='shrink-0'
          >
            <Link href='/dashboard/inventory/new'>Add item</Link>
          </Button>
        ) : null}
      </div>

      {!filters.lowStock ? <LowStockAlert items={lowStockItems} /> : null}

      <Suspense fallback={<div className='text-sm text-muted-foreground'>Loading filters...</div>}>
        <InventoryFilters
          query={filters.q ?? ''}
          status={filters.status ?? 'ALL'}
          lowStock={Boolean(filters.lowStock)}
        />
      </Suspense>

      {items.length > 0 ? (
        <InventoryTable
          items={items}
          canManage={canManage}
        />
      ) : (
        <InventoryEmptyState
          canManage={canManage}
          hasFilters={hasFilters}
        />
      )}
    </div>
  );
}
