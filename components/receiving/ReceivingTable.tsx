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
import type { ReceivingListItem } from '@/lib/receiving';

export function ReceivingTable({
  receivings,
  canManage,
}: {
  receivings: ReceivingListItem[];
  canManage: boolean;
}) {
  return (
    <div className='rounded-xl border'>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Number</TableHead>
            <TableHead>Warehouse</TableHead>
            <TableHead>PO</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Received</TableHead>
            <TableHead className='text-right'>Qty</TableHead>
            <TableHead className='w-[100px] text-right'>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {receivings.map((receiving) => (
            <TableRow key={receiving.id}>
              <TableCell className='font-medium'>{receiving.number}</TableCell>
              <TableCell>
                {receiving.warehouseName} ({receiving.warehouseCode})
              </TableCell>
              <TableCell className='text-muted-foreground'>
                {receiving.purchaseOrderNumber ?? '—'}
              </TableCell>
              <TableCell>
                <StatusBadge status={receiving.status} />
              </TableCell>
              <TableCell className='text-muted-foreground'>
                {receiving.receivedAt
                  ? new Date(receiving.receivedAt).toLocaleDateString()
                  : '—'}
              </TableCell>
              <TableCell className='text-right tabular-nums'>
                {receiving.totalReceived.toLocaleString()}
              </TableCell>
              <TableCell className='text-right'>
                <Button
                  variant='ghost'
                  size='sm'
                  asChild
                >
                  <Link href={`/dashboard/receiving/${receiving.id}`}>
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
