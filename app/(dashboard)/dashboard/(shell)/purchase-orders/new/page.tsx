import { redirect } from 'next/navigation';

import { DashboardPageHeader } from '@/components/dashboard/DashboardPageHeader';
import { PurchaseOrderForm } from '@/components/purchase-orders/PurchaseOrderForm';
import { canManageOperations } from '@/lib/permissions';
import { listActiveInventoryItems } from '@/lib/shipments';
import { listActiveSuppliers } from '@/lib/suppliers';
import { requireTenantContext } from '@/lib/tenant-context';

export default async function NewPurchaseOrderPage() {
  const { tenant, role } = await requireTenantContext();

  if (!canManageOperations(role)) {
    redirect('/dashboard/purchase-orders');
  }

  const [suppliers, inventoryItems] = await Promise.all([
    listActiveSuppliers(tenant.id),
    listActiveInventoryItems(tenant.id),
  ]);

  return (
    <div className='mx-auto flex w-full max-w-4xl flex-col gap-6'>
      <DashboardPageHeader
        title='New purchase order'
        description='Create a draft PO to send to a supplier.'
      />
      <PurchaseOrderForm
        suppliers={suppliers.map((s) => ({ id: s.id, label: s.name }))}
        inventoryItems={inventoryItems.map((item) => ({
          id: item.id,
          label: `${item.sku} — ${item.name}`,
        }))}
      />
    </div>
  );
}
