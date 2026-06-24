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
import type { OrderListItem } from '@/lib/orders';

export function OrderTable({
  orders,
  canManage,
}: {
  orders: OrderListItem[];
  canManage: boolean;
}) {
  return (
    <div className='rounded-xl border'>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Number</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Ordered</TableHead>
            <TableHead className='text-right'>Qty</TableHead>
            <TableHead className='text-right'>Picked</TableHead>
            <TableHead className='text-right'>Shipped</TableHead>
            <TableHead className='w-[100px] text-right'>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
            <TableRow key={order.id}>
              <TableCell className='font-medium'>{order.number}</TableCell>
              <TableCell>
                <StatusBadge status={order.status} />
              </TableCell>
              <TableCell className='text-muted-foreground'>
                {order.orderedAt
                  ? new Date(order.orderedAt).toLocaleDateString()
                  : '—'}
              </TableCell>
              <TableCell className='text-right tabular-nums'>
                {order.totalOrdered.toLocaleString()}
              </TableCell>
              <TableCell className='text-right tabular-nums'>
                {order.totalPicked.toLocaleString()}
              </TableCell>
              <TableCell className='text-right tabular-nums'>
                {order.totalShipped.toLocaleString()}
              </TableCell>
              <TableCell className='text-right'>
                <Button
                  variant='ghost'
                  size='sm'
                  asChild
                >
                  <Link href={`/dashboard/orders/${order.id}`}>
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
