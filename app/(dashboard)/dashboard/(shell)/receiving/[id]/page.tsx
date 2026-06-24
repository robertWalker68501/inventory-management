import Link from 'next/link';
import { notFound } from 'next/navigation';

import { DashboardPageHeader } from '@/components/dashboard/DashboardPageHeader';
import { StatusBadge } from '@/components/operations/StatusBadge';
import { ReceivingActions } from '@/components/receiving/ReceivingActions';
import { ReceivingForm } from '@/components/receiving/ReceivingForm';
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
import { getOpenPurchaseOrders } from '@/lib/purchase-orders';
import { getReceiving, listAllStockLocations } from '@/lib/receiving';
import { listActiveInventoryItems, listActiveWarehouses } from '@/lib/shipments';
import { requireTenantContext } from '@/lib/tenant-context';

type ReceivingDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ReceivingDetailPage({
  params,
}: ReceivingDetailPageProps) {
  const { tenant, role } = await requireTenantContext();
  const { id } = await params;
  const canManage = canManageOperations(role);

  const [receiving, warehouses, locations, inventoryItems, purchaseOrders] =
    await Promise.all([
      getReceiving(tenant.id, id),
      listActiveWarehouses(tenant.id),
      listAllStockLocations(tenant.id),
      listActiveInventoryItems(tenant.id),
      getOpenPurchaseOrders(tenant.id),
    ]);

  if (!receiving) {
    notFound();
  }

  const isDraft = receiving.status === 'DRAFT';
  const formOptions = {
    warehouses: warehouses.map((w) => ({
      id: w.id,
      label: `${w.code} — ${w.name}`,
    })),
    locations,
    inventoryItems: inventoryItems.map((item) => ({
      id: item.id,
      label: `${item.sku} — ${item.name}`,
    })),
    purchaseOrders: purchaseOrders.map((po) => ({
      id: po.id,
      number: po.number,
      lines: po.lines.map((line) => ({
        id: line.id,
        inventoryItemId: line.inventoryItemId,
        quantityOrdered: line.quantityOrdered,
        quantityReceived: line.quantityReceived,
        itemLabel: `${line.inventoryItem.sku} — ${line.inventoryItem.name}`,
      })),
    })),
  };

  return (
    <div className='mx-auto flex w-full max-w-4xl flex-col gap-6'>
      <div className='flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between'>
        <DashboardPageHeader
          title={receiving.number}
          description={`${receiving.warehouse.name} · ${receiving.status.replaceAll('_', ' ')}`}
        />
        <Button
          variant='outline'
          asChild
        >
          <Link href='/dashboard/receiving'>Back</Link>
        </Button>
      </div>

      <div className='flex flex-wrap items-center gap-3'>
        <StatusBadge status={receiving.status} />
        {receiving.purchaseOrder ? (
          <Button
            variant='link'
            className='h-auto p-0'
            asChild
          >
            <Link href={`/dashboard/purchase-orders/${receiving.purchaseOrder.id}`}>
              PO {receiving.purchaseOrder.number}
            </Link>
          </Button>
        ) : null}
        {receiving.receivedAt ? (
          <span className='text-sm text-muted-foreground'>
            Received {new Date(receiving.receivedAt).toLocaleDateString()}
          </span>
        ) : null}
      </div>

      {canManage ? (
        <ReceivingActions
          receivingId={receiving.id}
          status={receiving.status}
        />
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Received lines</CardTitle>
          <CardDescription>Items and putaway locations.</CardDescription>
        </CardHeader>
        <CardContent className='px-0 pb-0'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU</TableHead>
                <TableHead>Item</TableHead>
                <TableHead>Location</TableHead>
                <TableHead className='text-right'>Qty</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {receiving.lines.map((line) => (
                <TableRow key={line.id}>
                  <TableCell className='font-medium'>
                    {line.inventoryItem.sku}
                  </TableCell>
                  <TableCell>{line.inventoryItem.name}</TableCell>
                  <TableCell className='text-muted-foreground'>
                    {line.stockLocation?.name ?? '—'}
                  </TableCell>
                  <TableCell className='text-right tabular-nums'>
                    {line.quantityReceived} {line.inventoryItem.unitOfMeasure}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {canManage && isDraft ? (
        <ReceivingForm
          receivingId={receiving.id}
          {...formOptions}
          defaultValues={{
            warehouseId: receiving.warehouseId,
            purchaseOrderId: receiving.purchaseOrderId ?? '',
            notes: receiving.notes ?? '',
            lines: receiving.lines.map((line) => ({
              inventoryItemId: line.inventoryItemId,
              purchaseOrderLineId: line.purchaseOrderLineId ?? '',
              stockLocationId: line.stockLocationId ?? '',
              quantityReceived: line.quantityReceived,
            })),
          }}
        />
      ) : null}
    </div>
  );
}
