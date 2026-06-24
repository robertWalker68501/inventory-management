import Link from 'next/link';
import { Suspense } from 'react';

import { DashboardPageHeader } from '@/components/dashboard/DashboardPageHeader';
import { ListFilters } from '@/components/operations/ListFilters';
import { ShipmentTable } from '@/components/shipments/ShipmentTable';
import { Button } from '@/components/ui/button';
import { canManageOperations } from '@/lib/permissions';
import { listShipments } from '@/lib/shipments';
import { requireTenantContext } from '@/lib/tenant-context';
import {
  parseShipmentListFilters,
  shipmentStatuses,
} from '@/lib/validations/operations';

type ShipmentsPageProps = {
  searchParams: Promise<{ q?: string; status?: string }>;
};

export default async function ShipmentsPage({ searchParams }: ShipmentsPageProps) {
  const { tenant, role } = await requireTenantContext();
  const params = await searchParams;
  const filters = parseShipmentListFilters(params);
  const shipments = await listShipments(tenant.id, filters);
  const canManage = canManageOperations(role);
  const hasFilters = Boolean(filters.q || (filters.status && filters.status !== 'ALL'));

  return (
    <div className='flex flex-col gap-6'>
      <div className='flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between'>
        <DashboardPageHeader
          title='Shipments'
          description='Create shipments, ship from warehouse, and track delivery.'
        />
        {canManage ? (
          <Button
            asChild
            className='shrink-0'
          >
            <Link href='/dashboard/shipments/new'>New shipment</Link>
          </Button>
        ) : null}
      </div>

      <Suspense fallback={<div className='text-sm text-muted-foreground'>Loading filters...</div>}>
        <ListFilters
          query={filters.q ?? ''}
          status={filters.status ?? 'ALL'}
          statusOptions={shipmentStatuses}
          searchPlaceholder='Search shipment, order, or tracking'
        />
      </Suspense>

      {shipments.length > 0 ? (
        <ShipmentTable
          shipments={shipments}
          canManage={canManage}
        />
      ) : (
        <div className='rounded-xl border border-dashed px-6 py-16 text-center text-sm text-muted-foreground'>
          {hasFilters ? 'No shipments match your filters.' : 'No shipments yet.'}
        </div>
      )}
    </div>
  );
}
