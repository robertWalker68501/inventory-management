import Link from 'next/link';
import { Suspense } from 'react';

import { DashboardPageHeader } from '@/components/dashboard/DashboardPageHeader';
import { WarehouseFilters } from '@/components/warehouses/WarehouseFilters';
import {
  WarehouseEmptyState,
  WarehouseTable,
} from '@/components/warehouses/WarehouseTable';
import { Button } from '@/components/ui/button';
import { canManageWarehouses } from '@/lib/permissions';
import { requireTenantContext } from '@/lib/tenant-context';
import { listWarehouses } from '@/lib/warehouses';
import { parseWarehouseListFilters } from '@/lib/validations/warehouse';

type WarehousesPageProps = {
  searchParams: Promise<{
    q?: string;
    active?: string;
  }>;
};

export default async function WarehousesPage({
  searchParams,
}: WarehousesPageProps) {
  const { tenant, role } = await requireTenantContext();
  const params = await searchParams;
  const filters = parseWarehouseListFilters(params);
  const warehouses = await listWarehouses(tenant.id, filters);
  const canManage = canManageWarehouses(role);
  const hasFilters = Boolean(filters.q || filters.activeOnly);

  return (
    <div className='flex flex-col gap-6'>
      <div className='flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between'>
        <DashboardPageHeader
          title='Warehouses'
          description='Manage warehouse facilities, stock locations, and bin coordinates.'
        />
        {canManage ? (
          <Button
            asChild
            className='shrink-0'
          >
            <Link href='/dashboard/warehouses/new'>Add warehouse</Link>
          </Button>
        ) : null}
      </div>

      <Suspense fallback={<div className='text-sm text-muted-foreground'>Loading filters...</div>}>
        <WarehouseFilters
          query={filters.q ?? ''}
          activeOnly={Boolean(filters.activeOnly)}
        />
      </Suspense>

      {warehouses.length > 0 ? (
        <WarehouseTable
          warehouses={warehouses}
          canManage={canManage}
        />
      ) : (
        <WarehouseEmptyState
          canManage={canManage}
          hasFilters={hasFilters}
        />
      )}
    </div>
  );
}
