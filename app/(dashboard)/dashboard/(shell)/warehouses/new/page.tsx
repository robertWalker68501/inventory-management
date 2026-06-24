import Link from 'next/link';
import { redirect } from 'next/navigation';

import { DashboardPageHeader } from '@/components/dashboard/DashboardPageHeader';
import { WarehouseForm } from '@/components/warehouses/WarehouseForm';
import { Button } from '@/components/ui/button';
import { canManageWarehouses } from '@/lib/permissions';
import { requireTenantContext } from '@/lib/tenant-context';

export default async function NewWarehousePage() {
  const { role } = await requireTenantContext();

  if (!canManageWarehouses(role)) {
    redirect('/dashboard/warehouses');
  }

  return (
    <div className='mx-auto flex w-full max-w-3xl flex-col gap-6'>
      <div className='flex items-center justify-between gap-4'>
        <DashboardPageHeader
          title='Add warehouse'
          description='Create a new warehouse for your organization.'
        />
        <Button
          variant='outline'
          asChild
        >
          <Link href='/dashboard/warehouses'>Back to list</Link>
        </Button>
      </div>
      <WarehouseForm />
    </div>
  );
}
