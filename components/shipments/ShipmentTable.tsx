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
import type { ShipmentListItem } from '@/lib/shipments';

export function ShipmentTable({
  shipments,
  canManage,
}: {
  shipments: ShipmentListItem[];
  canManage: boolean;
}) {
  return (
    <div className='rounded-xl border'>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Number</TableHead>
            <TableHead>Order</TableHead>
            <TableHead>Warehouse</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Tracking</TableHead>
            <TableHead className='text-right'>Qty</TableHead>
            <TableHead className='w-[100px] text-right'>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {shipments.map((shipment) => (
            <TableRow key={shipment.id}>
              <TableCell className='font-medium'>{shipment.number}</TableCell>
              <TableCell className='text-muted-foreground'>
                {shipment.orderNumber ?? '—'}
              </TableCell>
              <TableCell>
                {shipment.warehouseName} ({shipment.warehouseCode})
              </TableCell>
              <TableCell>
                <StatusBadge status={shipment.status} />
              </TableCell>
              <TableCell className='text-muted-foreground'>
                {shipment.trackingNumber ?? '—'}
              </TableCell>
              <TableCell className='text-right tabular-nums'>
                {shipment.totalShipped.toLocaleString()}
              </TableCell>
              <TableCell className='text-right'>
                <Button
                  variant='ghost'
                  size='sm'
                  asChild
                >
                  <Link href={`/dashboard/shipments/${shipment.id}`}>
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
