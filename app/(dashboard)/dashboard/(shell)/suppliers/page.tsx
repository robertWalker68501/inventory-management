import Link from 'next/link';
import { Suspense } from 'react';

import { DashboardPageHeader } from '@/components/dashboard/DashboardPageHeader';
import { ListFilters } from '@/components/operations/ListFilters';
import { SupplierTable } from '@/components/suppliers/SupplierTable';
import { Button } from '@/components/ui/button';
import { canManageOperations } from '@/lib/permissions';
import { listSuppliers } from '@/lib/suppliers';
import { requireTenantContext } from '@/lib/tenant-context';
import { parseSupplierListFilters } from '@/lib/validations/operations';

type SuppliersPageProps = {
  searchParams: Promise<{ q?: string; active?: string }>;
};

export default async function SuppliersPage({ searchParams }: SuppliersPageProps) {
  const { tenant, role } = await requireTenantContext();
  const params = await searchParams;
  const filters = parseSupplierListFilters(params);
  const suppliers = await listSuppliers(tenant.id, filters);
  const canManage = canManageOperations(role);
  const hasFilters = Boolean(filters.q || filters.activeOnly);

  return (
    <div className='flex flex-col gap-6'>
      <div className='flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between'>
        <DashboardPageHeader
          title='Suppliers'
          description='Maintain vendor records for purchasing and receiving.'
        />
        {canManage ? (
          <Button
            asChild
            className='shrink-0'
          >
            <Link href='/dashboard/suppliers/new'>Add supplier</Link>
          </Button>
        ) : null}
      </div>

      <Suspense fallback={<div className='text-sm text-muted-foreground'>Loading filters...</div>}>
        <ListFilters
          query={filters.q ?? ''}
          activeOnly={Boolean(filters.activeOnly)}
          searchPlaceholder='Search name, email, or phone'
        />
      </Suspense>

      {suppliers.length > 0 ? (
        <SupplierTable
          suppliers={suppliers}
          canManage={canManage}
        />
      ) : (
        <div className='rounded-xl border border-dashed px-6 py-16 text-center text-sm text-muted-foreground'>
          {hasFilters ? 'No suppliers match your filters.' : 'No suppliers yet.'}
        </div>
      )}
    </div>
  );
}
