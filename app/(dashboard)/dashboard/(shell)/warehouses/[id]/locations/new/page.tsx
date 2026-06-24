import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

import { DashboardPageHeader } from '@/components/dashboard/DashboardPageHeader';
import { StockLocationForm } from '@/components/warehouses/StockLocationForm';
import { Button } from '@/components/ui/button';
import { canManageWarehouses } from '@/lib/permissions';
import { requireTenantContext } from '@/lib/tenant-context';
import { getWarehouse } from '@/lib/warehouses';

type NewStockLocationPageProps = {
  params: Promise<{ id: string }>;
};

export default async function NewStockLocationPage({
  params,
}: NewStockLocationPageProps) {
  const { tenant, role } = await requireTenantContext();
  const { id } = await params;

  if (!canManageWarehouses(role)) {
    redirect(`/dashboard/warehouses/${id}`);
  }

  const warehouse = await getWarehouse(tenant.id, id);

  if (!warehouse) {
    notFound();
  }

  return (
    <div className='mx-auto flex w-full max-w-3xl flex-col gap-6'>
      <div className='flex items-center justify-between gap-4'>
        <DashboardPageHeader
          title='Add stock location'
          description={`${warehouse.name} (${warehouse.code})`}
        />
        <Button
          variant='outline'
          asChild
        >
          <Link href={`/dashboard/warehouses/${warehouse.id}`}>Back to warehouse</Link>
        </Button>
      </div>
      <StockLocationForm warehouseId={warehouse.id} />
    </div>
  );
}
