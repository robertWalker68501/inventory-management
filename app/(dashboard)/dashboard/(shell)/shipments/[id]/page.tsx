import Link from 'next/link';
import { notFound } from 'next/navigation';

import { DashboardPageHeader } from '@/components/dashboard/DashboardPageHeader';
import { StatusBadge } from '@/components/operations/StatusBadge';
import { ShipmentActions } from '@/components/shipments/ShipmentActions';
import { ShipmentForm } from '@/components/shipments/ShipmentForm';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { canManageOperations } from '@/lib/permissions';
import { getShippableOrders } from '@/lib/orders';
import {
  getShipment,
  listActiveInventoryItems,
  listActiveWarehouses,
} from '@/lib/shipments';
import { requireTenantContext } from '@/lib/tenant-context';

type ShipmentDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ShipmentDetailPage({
  params,
}: ShipmentDetailPageProps) {
  const { tenant, role } = await requireTenantContext();
  const { id } = await params;
  const canManage = canManageOperations(role);

  const [shipment, warehouses, inventoryItems, orders] = await Promise.all([
    getShipment(tenant.id, id),
    listActiveWarehouses(tenant.id),
    listActiveInventoryItems(tenant.id),
    getShippableOrders(tenant.id),
  ]);

  if (!shipment) {
    notFound();
  }

  const isDraft = shipment.status === 'DRAFT';
  const formOptions = {
    warehouses: warehouses.map((w) => ({
      id: w.id,
      label: `${w.code} — ${w.name}`,
    })),
    inventoryItems: inventoryItems.map((item) => ({
      id: item.id,
      label: `${item.sku} — ${item.name}`,
    })),
    orders: orders.map((order) => ({
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
    })),
  };

  return (
    <div className='mx-auto flex w-full max-w-4xl flex-col gap-6'>
      <div className='flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between'>
        <DashboardPageHeader
          title={shipment.number}
          description={`${shipment.warehouse.name} · ${shipment.status.replaceAll('_', ' ')}`}
        />
        <Button
          variant='outline'
          asChild
        >
          <Link href='/dashboard/shipments'>Back</Link>
        </Button>
      </div>

      <div className='flex flex-wrap items-center gap-3'>
        <StatusBadge status={shipment.status} />
        {shipment.order ? (
          <Button
            variant='link'
            className='h-auto p-0'
            asChild
          >
            <Link href={`/dashboard/orders/${shipment.order.id}`}>
              Order {shipment.order.number}
            </Link>
          </Button>
        ) : null}
        {shipment.trackingNumber ? (
          <span className='text-sm text-muted-foreground'>
            Tracking {shipment.trackingNumber}
          </span>
        ) : null}
        {shipment.shippedAt ? (
          <span className='text-sm text-muted-foreground'>
            Shipped {new Date(shipment.shippedAt).toLocaleDateString()}
          </span>
        ) : null}
      </div>

      {canManage ? (
        <ShipmentActions
          shipmentId={shipment.id}
          status={shipment.status}
        />
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Shipment lines</CardTitle>
          <CardDescription>Items included in this shipment.</CardDescription>
        </CardHeader>
        <CardContent className='px-0 pb-0'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU</TableHead>
                <TableHead>Item</TableHead>
                <TableHead className='text-right'>Qty shipped</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {shipment.lines.map((line) => (
                <TableRow key={line.id}>
                  <TableCell className='font-medium'>
                    {line.inventoryItem.sku}
                  </TableCell>
                  <TableCell>{line.inventoryItem.name}</TableCell>
                  <TableCell className='text-right tabular-nums'>
                    {line.quantityShipped} {line.inventoryItem.unitOfMeasure}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {canManage && isDraft ? (
        <ShipmentForm
          shipmentId={shipment.id}
          {...formOptions}
          defaultValues={{
            orderId: shipment.orderId ?? '',
            warehouseId: shipment.warehouseId,
            trackingNumber: shipment.trackingNumber ?? '',
            notes: shipment.notes ?? '',
            lines: shipment.lines.map((line) => ({
              orderLineId: line.orderLineId ?? '',
              inventoryItemId: line.inventoryItemId,
              quantityShipped: line.quantityShipped,
            })),
          }}
        />
      ) : null}
    </div>
  );
}
