import Link from 'next/link';
import { Suspense } from 'react';

import { DashboardPageHeader } from '@/components/dashboard/DashboardPageHeader';
import { ListFilters } from '@/components/operations/ListFilters';
import { OrderTable } from '@/components/orders/OrderTable';
import { Button } from '@/components/ui/button';
import { canManageOperations } from '@/lib/permissions';
import { listOrders } from '@/lib/orders';
import { requireTenantContext } from '@/lib/tenant-context';
import { orderStatuses, parseOrderListFilters } from '@/lib/validations/operations';

type OrdersPageProps = {
  searchParams: Promise<{ q?: string; status?: string }>;
};

export default async function OrdersPage({ searchParams }: OrdersPageProps) {
  const { tenant, role } = await requireTenantContext();
  const params = await searchParams;
  const filters = parseOrderListFilters(params);
  const orders = await listOrders(tenant.id, filters);
  const canManage = canManageOperations(role);
  const hasFilters = Boolean(filters.q || (filters.status && filters.status !== 'ALL'));

  return (
    <div className='flex flex-col gap-6'>
      <div className='flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between'>
        <DashboardPageHeader
          title='Orders'
          description='Manage outbound orders, picking, and fulfillment.'
        />
        {canManage ? (
          <Button
            asChild
            className='shrink-0'
          >
            <Link href='/dashboard/orders/new'>New order</Link>
          </Button>
        ) : null}
      </div>

      <Suspense fallback={<div className='text-sm text-muted-foreground'>Loading filters...</div>}>
        <ListFilters
          query={filters.q ?? ''}
          status={filters.status ?? 'ALL'}
          statusOptions={orderStatuses}
          searchPlaceholder='Search order number or notes'
        />
      </Suspense>

      {orders.length > 0 ? (
        <OrderTable
          orders={orders}
          canManage={canManage}
        />
      ) : (
        <div className='rounded-xl border border-dashed px-6 py-16 text-center text-sm text-muted-foreground'>
          {hasFilters ? 'No orders match your filters.' : 'No orders yet.'}
        </div>
      )}
    </div>
  );
}
