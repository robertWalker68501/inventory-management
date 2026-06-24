import Link from 'next/link';

import { DeleteInventoryItemDialog } from '@/components/inventory/DeleteInventoryItemDialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ResponsiveTableShell } from '@/components/ui/responsive-table-shell';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { InventoryItemWithStock } from '@/lib/inventory';

type InventoryTableProps = {
  items: InventoryItemWithStock[];
  canManage: boolean;
};

function statusVariant(status: InventoryItemWithStock['status']) {
  switch (status) {
    case 'ACTIVE':
      return 'default' as const;
    case 'INACTIVE':
      return 'secondary' as const;
    case 'DISCONTINUED':
      return 'outline' as const;
  }
}

export function InventoryTable({ items, canManage }: InventoryTableProps) {
  return (
    <ResponsiveTableShell>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>SKU</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className='text-right'>On hand</TableHead>
            <TableHead className='text-right'>Available</TableHead>
            <TableHead className='text-right'>Reorder</TableHead>
            <TableHead className='w-[120px] text-right'>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id}>
              <TableCell className='font-medium'>{item.sku}</TableCell>
              <TableCell>
                <div className='flex flex-col gap-1'>
                  <span>{item.name}</span>
                  {item.isLowStock && item.status === 'ACTIVE' ? (
                    <Badge variant='destructive'>Low stock</Badge>
                  ) : null}
                </div>
              </TableCell>
              <TableCell>{item.category ?? '—'}</TableCell>
              <TableCell>
                <Badge variant={statusVariant(item.status)}>{item.status}</Badge>
              </TableCell>
              <TableCell className='text-right tabular-nums'>
                {item.quantityOnHand.toLocaleString()} {item.unitOfMeasure}
              </TableCell>
              <TableCell className='text-right tabular-nums'>
                {item.quantityAvailable.toLocaleString()}
              </TableCell>
              <TableCell className='text-right tabular-nums'>
                {item.reorderPoint.toLocaleString()}
              </TableCell>
              <TableCell className='text-right'>
                <div className='flex justify-end gap-2'>
                  <Button
                    variant='ghost'
                    size='sm'
                    asChild
                  >
                    <Link href={`/dashboard/inventory/${item.id}`}>
                      {canManage ? 'Edit' : 'View'}
                    </Link>
                  </Button>
                  {canManage ? (
                    <DeleteInventoryItemDialog
                      itemId={item.id}
                      itemName={item.name}
                    />
                  ) : null}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </ResponsiveTableShell>
  );
}
