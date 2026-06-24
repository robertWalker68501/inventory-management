import Link from 'next/link';
import { Suspense } from 'react';

import { DashboardPageHeader } from '@/components/dashboard/DashboardPageHeader';
import { ListFilters } from '@/components/operations/ListFilters';
import { PurchaseOrderTable } from '@/components/purchase-orders/PurchaseOrderTable';
import { Button } from '@/components/ui/button';
import { canManageOperations } from '@/lib/permissions';
import { listPurchaseOrders } from '@/lib/purchase-orders';
import { requireTenantContext } from '@/lib/tenant-context';
import {
  parsePurchaseOrderListFilters,
  purchaseOrderStatuses,
} from '@/lib/validations/operations';

type PurchaseOrdersPageProps = {
  searchParams: Promise<{ q?: string; status?: string }>;
};

export default async function PurchaseOrdersPage({
  searchParams,
}: PurchaseOrdersPageProps) {
  const { tenant, role } = await requireTenantContext();
  const params = await searchParams;
  const filters = parsePurchaseOrderListFilters(params);
  const orders = await listPurchaseOrders(tenant.id, filters);
  const canManage = canManageOperations(role);
  const hasFilters = Boolean(filters.q || (filters.status && filters.status !== 'ALL'));

  return (
    <div className='flex flex-col gap-6'>
      <div className='flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between'>
        <DashboardPageHeader
          title='Purchase orders'
          description='Create and track supplier purchase orders through receiving.'
        />
        {canManage ? (
          <Button
            asChild
            className='shrink-0'
          >
            <Link href='/dashboard/purchase-orders/new'>New PO</Link>
          </Button>
        ) : null}
      </div>

      <Suspense fallback={<div className='text-sm text-muted-foreground'>Loading filters...</div>}>
        <ListFilters
          query={filters.q ?? ''}
          status={filters.status ?? 'ALL'}
          statusOptions={purchaseOrderStatuses}
          searchPlaceholder='Search PO number or supplier'
        />
      </Suspense>

      {orders.length > 0 ? (
        <PurchaseOrderTable
          orders={orders}
          canManage={canManage}
        />
      ) : (
        <div className='rounded-xl border border-dashed px-6 py-16 text-center text-sm text-muted-foreground'>
          {hasFilters ? 'No purchase orders match your filters.' : 'No purchase orders yet.'}
        </div>
      )}
    </div>
  );
}
