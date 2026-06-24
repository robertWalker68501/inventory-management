import Link from 'next/link';

import { StatusBadge } from '@/components/operations/StatusBadge';
import { DeleteSupplierDialog } from '@/components/suppliers/DeleteSupplierDialog';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { SupplierWithCounts } from '@/lib/suppliers';

export function SupplierTable({
  suppliers,
  canManage,
}: {
  suppliers: SupplierWithCounts[];
  canManage: boolean;
}) {
  return (
    <div className='rounded-xl border'>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className='text-right'>POs</TableHead>
            <TableHead className='w-[120px] text-right'>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {suppliers.map((supplier) => (
            <TableRow key={supplier.id}>
              <TableCell className='font-medium'>{supplier.name}</TableCell>
              <TableCell className='text-muted-foreground'>
                {[supplier.email, supplier.phone].filter(Boolean).join(' · ') || '—'}
              </TableCell>
              <TableCell>
                <StatusBadge status={supplier.isActive ? 'ACTIVE' : 'INACTIVE'} />
              </TableCell>
              <TableCell className='text-right tabular-nums'>
                {supplier.purchaseOrderCount}
              </TableCell>
              <TableCell className='text-right'>
                <div className='flex justify-end gap-2'>
                  <Button
                    variant='ghost'
                    size='sm'
                    asChild
                  >
                    <Link href={`/dashboard/suppliers/${supplier.id}`}>
                      {canManage ? 'Manage' : 'View'}
                    </Link>
                  </Button>
                  {canManage ? (
                    <DeleteSupplierDialog
                      supplierId={supplier.id}
                      supplierName={supplier.name}
                      disabled={supplier.purchaseOrderCount > 0}
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
