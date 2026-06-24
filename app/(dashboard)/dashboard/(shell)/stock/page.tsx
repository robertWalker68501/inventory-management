import Link from 'next/link';

import { DashboardPageHeader } from '@/components/dashboard/DashboardPageHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { listInventoryItems } from '@/lib/inventory';
import { requireTenantContext } from '@/lib/tenant-context';

export default async function StockPage() {
  const { tenant } = await requireTenantContext();
  const items = await listInventoryItems(tenant.id, { status: 'ACTIVE' });

  return (
    <div className='flex flex-col gap-6'>
      <DashboardPageHeader
        title='Stock levels'
        description='On-hand, reserved, and available quantities by SKU.'
      />

      <div className='rounded-xl border'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>SKU</TableHead>
              <TableHead>Name</TableHead>
              <TableHead className='text-right'>On hand</TableHead>
              <TableHead className='text-right'>Reserved</TableHead>
              <TableHead className='text-right'>Available</TableHead>
              <TableHead className='text-right'>Incoming</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className='font-medium'>{item.sku}</TableCell>
                <TableCell>
                  <div className='flex items-center gap-2'>
                    <span>{item.name}</span>
                    {item.isLowStock ? (
                      <Badge variant='destructive'>Low</Badge>
                    ) : null}
                  </div>
                </TableCell>
                <TableCell className='text-right tabular-nums'>
                  {item.quantityOnHand.toLocaleString()}
                </TableCell>
                <TableCell className='text-right tabular-nums'>
                  {item.quantityReserved.toLocaleString()}
                </TableCell>
                <TableCell className='text-right tabular-nums'>
                  {item.quantityAvailable.toLocaleString()}
                </TableCell>
                <TableCell className='text-right tabular-nums'>
                  {item.quantityIncoming.toLocaleString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Button
        variant='outline'
        asChild
        className='w-fit'
      >
        <Link href='/dashboard/inventory'>Manage inventory items</Link>
      </Button>
    </div>
  );
}
