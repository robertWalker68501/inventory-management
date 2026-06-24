import Link from 'next/link';

import { StatusBadge } from '@/components/operations/StatusBadge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { PurchaseOrderListItem } from '@/lib/purchase-orders';

export function PurchaseOrderTable({
  orders,
  canManage,
}: {
  orders: PurchaseOrderListItem[];
  canManage: boolean;
}) {
  return (
    <div className='rounded-xl border'>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Number</TableHead>
            <TableHead>Supplier</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Expected</TableHead>
            <TableHead className='text-right'>Ordered</TableHead>
            <TableHead className='text-right'>Received</TableHead>
            <TableHead className='w-[100px] text-right'>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
            <TableRow key={order.id}>
              <TableCell className='font-medium'>{order.number}</TableCell>
              <TableCell>{order.supplierName}</TableCell>
              <TableCell>
                <StatusBadge status={order.status} />
              </TableCell>
              <TableCell className='text-muted-foreground'>
                {order.expectedAt
                  ? new Date(order.expectedAt).toLocaleDateString()
                  : '—'}
              </TableCell>
              <TableCell className='text-right tabular-nums'>
                {order.totalOrdered.toLocaleString()}
              </TableCell>
              <TableCell className='text-right tabular-nums'>
                {order.totalReceived.toLocaleString()}
              </TableCell>
              <TableCell className='text-right'>
                <Button
                  variant='ghost'
                  size='sm'
                  asChild
                >
                  <Link href={`/dashboard/purchase-orders/${order.id}`}>
                    {canManage ? 'Manage' : 'View'}
                  </Link>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
