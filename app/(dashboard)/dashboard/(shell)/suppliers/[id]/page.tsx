import Link from 'next/link';
import { notFound } from 'next/navigation';

import { DashboardPageHeader } from '@/components/dashboard/DashboardPageHeader';
import { StatusBadge } from '@/components/operations/StatusBadge';
import { SupplierForm } from '@/components/suppliers/SupplierForm';
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
import { getSupplier } from '@/lib/suppliers';
import { requireTenantContext } from '@/lib/tenant-context';

type SupplierDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function SupplierDetailPage({
  params,
}: SupplierDetailPageProps) {
  const { tenant, role } = await requireTenantContext();
  const { id } = await params;
  const canManage = canManageOperations(role);

  const supplier = await getSupplier(tenant.id, id);

  if (!supplier) {
    notFound();
  }

  if (!canManage) {
    return (
      <div className='flex flex-col gap-6'>
        <DashboardPageHeader
          title={supplier.name}
          description='Supplier details'
        />
        <Card>
          <CardContent className='grid gap-4 pt-6 sm:grid-cols-2'>
            <DetailField
              label='Email'
              value={supplier.email ?? '—'}
            />
            <DetailField
              label='Phone'
              value={supplier.phone ?? '—'}
            />
            <DetailField
              label='Address'
              value={supplier.address ?? '—'}
            />
            <DetailField
              label='Status'
              value={supplier.isActive ? 'Active' : 'Inactive'}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className='mx-auto flex w-full max-w-4xl flex-col gap-6'>
      <div className='flex items-center justify-between gap-4'>
        <DashboardPageHeader
          title={supplier.name}
          description={`${supplier._count.purchaseOrders} purchase orders`}
        />
        <Button
          variant='outline'
          asChild
        >
          <Link href='/dashboard/suppliers'>Back</Link>
        </Button>
      </div>

      {supplier.purchaseOrders.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Recent purchase orders</CardTitle>
            <CardDescription>Latest POs from this supplier.</CardDescription>
          </CardHeader>
          <CardContent className='px-0 pb-0'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Number</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ordered</TableHead>
                  <TableHead className='text-right'>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {supplier.purchaseOrders.map((po) => (
                  <TableRow key={po.id}>
                    <TableCell className='font-medium'>{po.number}</TableCell>
                    <TableCell>
                      <StatusBadge status={po.status} />
                    </TableCell>
                    <TableCell className='text-muted-foreground'>
                      {po.orderedAt
                        ? new Date(po.orderedAt).toLocaleDateString()
                        : '—'}
                    </TableCell>
                    <TableCell className='text-right'>
                      <Button
                        variant='ghost'
                        size='sm'
                        asChild
                      >
                        <Link href={`/dashboard/purchase-orders/${po.id}`}>View</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : null}

      <SupplierForm
        supplierId={supplier.id}
        defaultValues={{
          name: supplier.name,
          email: supplier.email ?? '',
          phone: supplier.phone ?? '',
          address: supplier.address ?? '',
          notes: supplier.notes ?? '',
          isActive: supplier.isActive,
        }}
      />
    </div>
  );
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div className='space-y-1'>
      <p className='text-sm text-muted-foreground'>{label}</p>
      <p className='font-medium'>{value}</p>
    </div>
  );
}
