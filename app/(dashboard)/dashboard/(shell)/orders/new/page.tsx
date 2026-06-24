import { redirect } from 'next/navigation';

import { DashboardPageHeader } from '@/components/dashboard/DashboardPageHeader';
import { OrderForm } from '@/components/orders/OrderForm';
import { canManageOperations } from '@/lib/permissions';
import { listActiveInventoryItems } from '@/lib/shipments';
import { requireTenantContext } from '@/lib/tenant-context';

export default async function NewOrderPage() {
  const { tenant, role } = await requireTenantContext();

  if (!canManageOperations(role)) {
    redirect('/dashboard/orders');
  }

  const inventoryItems = await listActiveInventoryItems(tenant.id);

  return (
    <div className='mx-auto flex w-full max-w-4xl flex-col gap-6'>
      <DashboardPageHeader
        title='New order'
        description='Create a draft outbound order.'
      />
      <OrderForm
        inventoryItems={inventoryItems.map((item) => ({
          id: item.id,
          label: `${item.sku} — ${item.name}`,
        }))}
      />
    </div>
  );
}
