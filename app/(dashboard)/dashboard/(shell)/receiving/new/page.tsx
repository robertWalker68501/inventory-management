import { redirect } from 'next/navigation';

import { DashboardPageHeader } from '@/components/dashboard/DashboardPageHeader';
import { ReceivingForm } from '@/components/receiving/ReceivingForm';
import { canManageOperations } from '@/lib/permissions';
import { getOpenPurchaseOrders } from '@/lib/purchase-orders';
import { listAllStockLocations } from '@/lib/receiving';
import { listActiveInventoryItems, listActiveWarehouses } from '@/lib/shipments';
import { requireTenantContext } from '@/lib/tenant-context';

type NewReceivingPageProps = {
  searchParams: Promise<{ purchaseOrderId?: string }>;
};

export default async function NewReceivingPage({
  searchParams,
}: NewReceivingPageProps) {
  const { tenant, role } = await requireTenantContext();

  if (!canManageOperations(role)) {
    redirect('/dashboard/receiving');
  }

  const params = await searchParams;

  const [warehouses, locations, inventoryItems, purchaseOrders] =
    await Promise.all([
      listActiveWarehouses(tenant.id),
      listAllStockLocations(tenant.id),
      listActiveInventoryItems(tenant.id),
      getOpenPurchaseOrders(tenant.id),
    ]);

  return (
    <div className='mx-auto flex w-full max-w-4xl flex-col gap-6'>
      <DashboardPageHeader
        title='New receiving'
        description='Record inbound goods against a PO or as a standalone receipt.'
      />
      <ReceivingForm
        warehouses={warehouses.map((w) => ({
          id: w.id,
          label: `${w.code} — ${w.name}`,
        }))}
        locations={locations}
        inventoryItems={inventoryItems.map((item) => ({
          id: item.id,
          label: `${item.sku} — ${item.name}`,
        }))}
        purchaseOrders={purchaseOrders.map((po) => ({
          id: po.id,
          number: po.number,
          lines: po.lines.map((line) => ({
            id: line.id,
            inventoryItemId: line.inventoryItemId,
            quantityOrdered: line.quantityOrdered,
            quantityReceived: line.quantityReceived,
            itemLabel: `${line.inventoryItem.sku} — ${line.inventoryItem.name}`,
          })),
        }))}
        initialPurchaseOrderId={params.purchaseOrderId}
      />
    </div>
  );
}
