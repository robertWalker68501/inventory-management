import Link from 'next/link';
import { Suspense } from 'react';

import { DashboardPageHeader } from '@/components/dashboard/DashboardPageHeader';
import { ListFilters } from '@/components/operations/ListFilters';
import { ReceivingTable } from '@/components/receiving/ReceivingTable';
import { Button } from '@/components/ui/button';
import { canManageOperations } from '@/lib/permissions';
import { listReceivings } from '@/lib/receiving';
import { requireTenantContext } from '@/lib/tenant-context';
import {
  parseReceivingListFilters,
  receivingStatuses,
} from '@/lib/validations/operations';

type ReceivingPageProps = {
  searchParams: Promise<{ q?: string; status?: string }>;
};

export default async function ReceivingPage({ searchParams }: ReceivingPageProps) {
  const { tenant, role } = await requireTenantContext();
  const params = await searchParams;
  const filters = parseReceivingListFilters(params);
  const receivings = await listReceivings(tenant.id, filters);
  const canManage = canManageOperations(role);
  const hasFilters = Boolean(filters.q || (filters.status && filters.status !== 'ALL'));

  return (
    <div className='flex flex-col gap-6'>
      <div className='flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between'>
        <DashboardPageHeader
          title='Receiving'
          description='Process inbound deliveries and put stock into warehouse locations.'
        />
        {canManage ? (
          <Button
            asChild
            className='shrink-0'
          >
            <Link href='/dashboard/receiving/new'>New receiving</Link>
          </Button>
        ) : null}
      </div>

      <Suspense fallback={<div className='text-sm text-muted-foreground'>Loading filters...</div>}>
        <ListFilters
          query={filters.q ?? ''}
          status={filters.status ?? 'ALL'}
          statusOptions={receivingStatuses}
          searchPlaceholder='Search receiving number, PO, or warehouse'
        />
      </Suspense>

      {receivings.length > 0 ? (
        <ReceivingTable
          receivings={receivings}
          canManage={canManage}
        />
      ) : (
        <div className='rounded-xl border border-dashed px-6 py-16 text-center text-sm text-muted-foreground'>
          {hasFilters ? 'No receivings match your filters.' : 'No receivings yet.'}
        </div>
      )}
    </div>
  );
}
