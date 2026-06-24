import Link from 'next/link';
import { redirect } from 'next/navigation';

import { InventoryItemForm } from '@/components/inventory/InventoryItemForm';
import { DashboardPageHeader } from '@/components/dashboard/DashboardPageHeader';
import { Button } from '@/components/ui/button';
import { canManageInventory } from '@/lib/permissions';
import { requireTenantContext } from '@/lib/tenant-context';

export default async function NewInventoryItemPage() {
  const { role } = await requireTenantContext();

  if (!canManageInventory(role)) {
    redirect('/dashboard/inventory');
  }

  return (
    <div className='mx-auto flex w-full max-w-3xl flex-col gap-6'>
      <div className='flex items-center justify-between gap-4'>
        <DashboardPageHeader
          title='Add inventory item'
          description='Create a new SKU in your organization catalog.'
        />
        <Button
          variant='outline'
          asChild
        >
          <Link href='/dashboard/inventory'>Back to list</Link>
        </Button>
      </div>
      <InventoryItemForm />
    </div>
  );
}
