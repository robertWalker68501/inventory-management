import Link from 'next/link';
import { notFound } from 'next/navigation';

import { DashboardPageHeader } from '@/components/dashboard/DashboardPageHeader';
import { StatusBadge } from '@/components/operations/StatusBadge';
import { PurchaseOrderActions } from '@/components/purchase-orders/PurchaseOrderActions';
import { PurchaseOrderForm } from '@/components/purchase-orders/PurchaseOrderForm';
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
import { getPurchaseOrder } from '@/lib/purchase-orders';
import { listActiveInventoryItems } from '@/lib/shipments';
import { listActiveSuppliers } from '@/lib/suppliers';
import { requireTenantContext } from '@/lib/tenant-context';

type PurchaseOrderDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function PurchaseOrderDetailPage({
  params,
}: PurchaseOrderDetailPageProps) {
  const { tenant, role } = await requireTenantContext();
  const { id } = await params;
  const canManage = canManageOperations(role);

  const [order, suppliers, inventoryItems] = await Promise.all([
    getPurchaseOrder(tenant.id, id),
    listActiveSuppliers(tenant.id),
    listActiveInventoryItems(tenant.id),
  ]);

  if (!order) {
    notFound();
  }

  const isDraft = order.status === 'DRAFT';

  return (
    <div className='mx-auto flex w-full max-w-4xl flex-col gap-6'>
      <div className='flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between'>
        <DashboardPageHeader
          title={order.number}
          description={`${order.supplier.name} · ${order.status.replaceAll('_', ' ')}`}
        />
        <Button
          variant='outline'
          asChild
        >
          <Link href='/dashboard/purchase-orders'>Back</Link>
        </Button>
      </div>

      <div className='flex flex-wrap items-center gap-3'>
        <StatusBadge status={order.status} />
        {order.expectedAt ? (
          <span className='text-sm text-muted-foreground'>
            Expected {new Date(order.expectedAt).toLocaleDateString()}
          </span>
        ) : null}
      </div>

      {canManage ? <PurchaseOrderActions purchaseOrderId={order.id} status={order.status} /> : null}

      <Card>
        <CardHeader>
          <CardTitle>Line items</CardTitle>
          <CardDescription>Ordered and received quantities per SKU.</CardDescription>
        </CardHeader>
        <CardContent className='px-0 pb-0'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU</TableHead>
                <TableHead>Item</TableHead>
                <TableHead className='text-right'>Ordered</TableHead>
                <TableHead className='text-right'>Received</TableHead>
                <TableHead className='text-right'>Unit cost</TableHead>
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
                    {line.quantityReceived}
                  </TableCell>
                  <TableCell className='text-right tabular-nums'>
                    {line.unitCost ? `$${line.unitCost}` : '—'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {order.receivings.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Receivings</CardTitle>
          </CardHeader>
          <CardContent className='px-0 pb-0'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Number</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Received</TableHead>
                  <TableHead className='text-right'>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {order.receivings.map((receiving) => (
                  <TableRow key={receiving.id}>
                    <TableCell className='font-medium'>{receiving.number}</TableCell>
                    <TableCell>
                      <StatusBadge status={receiving.status} />
                    </TableCell>
                    <TableCell className='text-muted-foreground'>
                      {receiving.receivedAt
                        ? new Date(receiving.receivedAt).toLocaleDateString()
                        : '—'}
                    </TableCell>
                    <TableCell className='text-right'>
                      <Button
                        variant='ghost'
                        size='sm'
                        asChild
                      >
                        <Link href={`/dashboard/receiving/${receiving.id}`}>View</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : null}

      {canManage && isDraft ? (
        <PurchaseOrderForm
          purchaseOrderId={order.id}
          suppliers={suppliers.map((s) => ({ id: s.id, label: s.name }))}
          inventoryItems={inventoryItems.map((item) => ({
            id: item.id,
            label: `${item.sku} — ${item.name}`,
          }))}
          defaultValues={{
            supplierId: order.supplierId,
            expectedAt: order.expectedAt
              ? new Date(order.expectedAt).toISOString().slice(0, 10)
              : '',
            notes: order.notes ?? '',
            lines: order.lines.map((line) => ({
              inventoryItemId: line.inventoryItemId,
              quantityOrdered: line.quantityOrdered,
              unitCost: line.unitCost ? Number.parseFloat(line.unitCost) : undefined,
            })),
          }}
        />
      ) : null}
    </div>
  );
}
