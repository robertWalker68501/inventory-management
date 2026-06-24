import Link from 'next/link';
import { notFound } from 'next/navigation';

import { DashboardPageHeader } from '@/components/dashboard/DashboardPageHeader';
import { StatusBadge } from '@/components/operations/StatusBadge';
import { OrderActions } from '@/components/orders/OrderActions';
import { OrderForm } from '@/components/orders/OrderForm';
import { PickOrderForm } from '@/components/orders/PickOrderForm';
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
import { getOrder } from '@/lib/orders';
import { listActiveInventoryItems } from '@/lib/shipments';
import { requireTenantContext } from '@/lib/tenant-context';

type OrderDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const { tenant, role } = await requireTenantContext();
  const { id } = await params;
  const canManage = canManageOperations(role);

  const [order, inventoryItems] = await Promise.all([
    getOrder(tenant.id, id),
    listActiveInventoryItems(tenant.id),
  ]);

  if (!order) {
    notFound();
  }

  const isDraft = order.status === 'DRAFT';
  const canPick = ['CONFIRMED', 'PICKING', 'PACKED'].includes(order.status);

  return (
    <div className='mx-auto flex w-full max-w-4xl flex-col gap-6'>
      <div className='flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between'>
        <DashboardPageHeader
          title={order.number}
          description={order.status.replaceAll('_', ' ')}
        />
        <Button
          variant='outline'
          asChild
        >
          <Link href='/dashboard/orders'>Back</Link>
        </Button>
      </div>

      <div className='flex flex-wrap items-center gap-3'>
        <StatusBadge status={order.status} />
        {order.orderedAt ? (
          <span className='text-sm text-muted-foreground'>
            Ordered {new Date(order.orderedAt).toLocaleDateString()}
          </span>
        ) : null}
      </div>

      {canManage ? (
        <OrderActions
          orderId={order.id}
          status={order.status}
        />
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Line items</CardTitle>
          <CardDescription>Ordered, picked, and shipped quantities.</CardDescription>
        </CardHeader>
        <CardContent className='px-0 pb-0'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU</TableHead>
                <TableHead>Item</TableHead>
                <TableHead className='text-right'>Ordered</TableHead>
                <TableHead className='text-right'>Picked</TableHead>
                <TableHead className='text-right'>Shipped</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {order.lines.map((line) => (
                <TableRow key={line.id}>
                  <TableCell className='font-medium'>
                    {line.inventoryItem.sku}
                  </TableCell>
                  <TableCell>{line.inventoryItem.name}</TableCell>
                  <TableCell className='text-right tabular-nums'>
                    {line.quantityOrdered} {line.inventoryItem.unitOfMeasure}
                  </TableCell>
                  <TableCell className='text-right tabular-nums'>
                    {line.quantityPicked}
                  </TableCell>
                  <TableCell className='text-right tabular-nums'>
                    {line.quantityShipped}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {order.shipments.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Shipments</CardTitle>
          </CardHeader>
          <CardContent className='px-0 pb-0'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Number</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Shipped</TableHead>
                  <TableHead className='text-right'>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {order.shipments.map((shipment) => (
                  <TableRow key={shipment.id}>
                    <TableCell className='font-medium'>{shipment.number}</TableCell>
                    <TableCell>
                      <StatusBadge status={shipment.status} />
                    </TableCell>
                    <TableCell className='text-muted-foreground'>
                      {shipment.shippedAt
                        ? new Date(shipment.shippedAt).toLocaleDateString()
                        : '—'}
                    </TableCell>
                    <TableCell className='text-right'>
                      <Button
                        variant='ghost'
                        size='sm'
                        asChild
                      >
                        <Link href={`/dashboard/shipments/${shipment.id}`}>View</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : null}

      {canManage && canPick ? (
        <PickOrderForm
          orderId={order.id}
          lines={order.lines.map((line) => ({
            orderLineId: line.id,
            sku: line.inventoryItem.sku,
            name: line.inventoryItem.name,
            unitOfMeasure: line.inventoryItem.unitOfMeasure,
            quantityOrdered: line.quantityOrdered,
            quantityPicked: line.quantityPicked,
            quantityShipped: line.quantityShipped,
          }))}
        />
      ) : null}

      {canManage && isDraft ? (
        <OrderForm
          orderId={order.id}
          inventoryItems={inventoryItems.map((item) => ({
            id: item.id,
            label: `${item.sku} — ${item.name}`,
          }))}
          defaultValues={{
            notes: order.notes ?? '',
            lines: order.lines.map((line) => ({
              inventoryItemId: line.inventoryItemId,
              quantityOrdered: line.quantityOrdered,
            })),
          }}
        />
      ) : null}
    </div>
  );
}
