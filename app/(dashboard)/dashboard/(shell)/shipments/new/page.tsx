import { redirect } from 'next/navigation';

import { DashboardPageHeader } from '@/components/dashboard/DashboardPageHeader';
import { ShipmentForm } from '@/components/shipments/ShipmentForm';
import { canManageOperations } from '@/lib/permissions';
import { getShippableOrders } from '@/lib/orders';
import {
  listActiveInventoryItems,
  listActiveWarehouses,
} from '@/lib/shipments';
import { requireTenantContext } from '@/lib/tenant-context';

type NewShipmentPageProps = {
  searchParams: Promise<{ orderId?: string }>;
};

export default async function NewShipmentPage({
  searchParams,
}: NewShipmentPageProps) {
  const { tenant, role } = await requireTenantContext();

  if (!canManageOperations(role)) {
    redirect('/dashboard/shipments');
  }

  const params = await searchParams;

  const [warehouses, inventoryItems, orders] = await Promise.all([
    listActiveWarehouses(tenant.id),
    listActiveInventoryItems(tenant.id),
    getShippableOrders(tenant.id),
  ]);

  return (
    <div className='mx-auto flex w-full max-w-4xl flex-col gap-6'>
      <DashboardPageHeader
        title='New shipment'
        description='Ship picked items from a warehouse to fulfill an order.'
      />
      <ShipmentForm
        warehouses={warehouses.map((w) => ({
          id: w.id,
          label: `${w.code} — ${w.name}`,
        }))}
        inventoryItems={inventoryItems.map((item) => ({
          id: item.id,
          label: `${item.sku} — ${item.name}`,
        }))}
        orders={orders.map((order) => ({
          id: order.id,
          number: order.number,
          lines: order.lines.map((line) => ({
            id: line.id,
            inventoryItemId: line.inventoryItemId,
            quantityOrdered: line.quantityOrdered,
            quantityPicked: line.quantityPicked,
            quantityShipped: line.quantityShipped,
            itemLabel: `${line.inventoryItem.sku} — ${line.inventoryItem.name}`,
          })),
        }))}
        initialOrderId={params.orderId}
      />
    </div>
  );
}
