import Link from 'next/link';

import { DeleteStockLocationDialog } from '@/components/warehouses/DeleteStockLocationDialog';
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
import type { StockLocationWithStock } from '@/lib/warehouses';
import { formatBinLabel } from '@/lib/validations/warehouse';

export function StockLocationTable({
  warehouseId,
  locations,
  canManage,
}: {
  warehouseId: string;
  locations: StockLocationWithStock[];
  canManage: boolean;
}) {
  if (locations.length === 0) {
    return (
      <div className='rounded-xl border border-dashed px-6 py-10 text-center text-sm text-muted-foreground'>
        No stock locations yet.
        {canManage ? ' Add a location to start bin tracking.' : ''}
      </div>
    );
  }

  return (
    <div className='rounded-xl border'>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Location</TableHead>
            <TableHead>Aisle</TableHead>
            <TableHead>Rack</TableHead>
            <TableHead>Bin</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className='text-right'>SKUs</TableHead>
            <TableHead className='text-right'>On hand</TableHead>
            <TableHead className='w-[120px] text-right'>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {locations.map((location) => (
            <TableRow key={location.id}>
              <TableCell className='font-medium'>
                {formatBinLabel(location)}
              </TableCell>
              <TableCell>{location.aisle ?? '—'}</TableCell>
              <TableCell>{location.rack ?? '—'}</TableCell>
              <TableCell>{location.bin ?? '—'}</TableCell>
              <TableCell>
                <Badge variant={location.isActive ? 'default' : 'secondary'}>
                  {location.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </TableCell>
              <TableCell className='text-right tabular-nums'>
                {location.stockLineCount}
              </TableCell>
              <TableCell className='text-right tabular-nums'>
                {location.totalOnHand.toLocaleString()}
              </TableCell>
              <TableCell className='text-right'>
                <div className='flex justify-end gap-2'>
                  <Button
                    variant='ghost'
                    size='sm'
                    asChild
                  >
                    <Link
                      href={`/dashboard/warehouses/${warehouseId}/locations/${location.id}`}
                    >
                      {canManage ? 'Edit' : 'View'}
                    </Link>
                  </Button>
                  {canManage ? (
                    <DeleteStockLocationDialog
                      warehouseId={warehouseId}
                      locationId={location.id}
                      locationName={formatBinLabel(location)}
                    />
                  ) : null}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
