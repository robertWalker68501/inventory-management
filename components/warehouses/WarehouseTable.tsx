import Link from 'next/link';
import { Warehouse } from 'lucide-react';

import { DeleteWarehouseDialog } from '@/components/warehouses/DeleteWarehouseDialog';
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
import type { WarehouseWithCounts } from '@/lib/warehouses';

export function WarehouseEmptyState({
  canManage,
  hasFilters,
}: {
  canManage: boolean;
  hasFilters: boolean;
}) {
  return (
    <div className='flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed px-6 py-16 text-center'>
      <div className='flex size-12 items-center justify-center rounded-lg bg-muted'>
        <Warehouse className='size-6' />
      </div>
      <div className='space-y-1'>
        <h2 className='font-heading text-lg font-medium'>
          {hasFilters ? 'No warehouses match your filters' : 'No warehouses yet'}
        </h2>
        <p className='max-w-md text-sm text-muted-foreground'>
          {hasFilters
            ? 'Try adjusting your search or filters.'
            : 'Add your first warehouse to start organizing stock locations and bins.'}
        </p>
      </div>
      {canManage && !hasFilters ? (
        <Button asChild>
          <Link href='/dashboard/warehouses/new'>Add warehouse</Link>
        </Button>
      ) : null}
    </div>
  );
}

export function WarehouseTable({
  warehouses,
  canManage,
}: {
  warehouses: WarehouseWithCounts[];
  canManage: boolean;
}) {
  return (
    <div className='rounded-xl border'>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Code</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className='text-right'>Locations</TableHead>
            <TableHead className='text-right'>On hand</TableHead>
            <TableHead className='w-[120px] text-right'>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {warehouses.map((warehouse) => (
            <TableRow key={warehouse.id}>
              <TableCell className='font-medium'>{warehouse.code}</TableCell>
              <TableCell>{warehouse.name}</TableCell>
              <TableCell className='text-muted-foreground'>
                {[warehouse.city, warehouse.state].filter(Boolean).join(', ') ||
                  '—'}
              </TableCell>
              <TableCell>
                <Badge variant={warehouse.isActive ? 'default' : 'secondary'}>
                  {warehouse.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </TableCell>
              <TableCell className='text-right tabular-nums'>
                {warehouse.locationCount}
              </TableCell>
              <TableCell className='text-right tabular-nums'>
                {warehouse.totalOnHand.toLocaleString()}
              </TableCell>
              <TableCell className='text-right'>
                <div className='flex justify-end gap-2'>
                  <Button
                    variant='ghost'
                    size='sm'
                    asChild
                  >
                    <Link href={`/dashboard/warehouses/${warehouse.id}`}>
                      {canManage ? 'Manage' : 'View'}
                    </Link>
                  </Button>
                  {canManage ? (
                    <DeleteWarehouseDialog
                      warehouseId={warehouse.id}
                      warehouseName={warehouse.name}
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
