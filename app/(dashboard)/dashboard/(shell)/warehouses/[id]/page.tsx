import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';

import { DashboardPageHeader } from '@/components/dashboard/DashboardPageHeader';
import { StockLocationTable } from '@/components/warehouses/StockLocationTable';
import { WarehouseForm } from '@/components/warehouses/WarehouseForm';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { canManageWarehouses } from '@/lib/permissions';
import { requireTenantContext } from '@/lib/tenant-context';
import { getWarehouse } from '@/lib/warehouses';

type WarehouseDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function WarehouseDetailPage({
  params,
}: WarehouseDetailPageProps) {
  const { tenant, role } = await requireTenantContext();
  const { id } = await params;
  const warehouse = await getWarehouse(tenant.id, id);

  if (!warehouse) {
    notFound();
  }

  const canManage = canManageWarehouses(role);

  return (
    <div className='flex flex-col gap-6'>
      <div className='flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between'>
        <DashboardPageHeader
          title={warehouse.name}
          description={`${warehouse.code} · ${[warehouse.city, warehouse.state].filter(Boolean).join(', ') || 'No address on file'}`}
        />
        <Button
          variant='outline'
          asChild
        >
          <Link href='/dashboard/warehouses'>Back to list</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Warehouse summary</CardTitle>
          <CardDescription>Operational footprint for this facility.</CardDescription>
        </CardHeader>
        <CardContent className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
          <SummaryStat
            label='Status'
            value={
              <Badge variant={warehouse.isActive ? 'default' : 'secondary'}>
                {warehouse.isActive ? 'Active' : 'Inactive'}
              </Badge>
            }
          />
          <SummaryStat
            label='Stock locations'
            value={warehouse.locationCount.toLocaleString()}
          />
          <SummaryStat
            label='Stock lines'
            value={warehouse.stockLineCount.toLocaleString()}
          />
          <SummaryStat
            label='Units on hand'
            value={warehouse.totalOnHand.toLocaleString()}
          />
        </CardContent>
      </Card>

      {canManage ? (
        <WarehouseForm
          warehouseId={warehouse.id}
          defaultValues={{
            name: warehouse.name,
            code: warehouse.code,
            address: warehouse.address ?? '',
            city: warehouse.city ?? '',
            state: warehouse.state ?? '',
            postalCode: warehouse.postalCode ?? '',
            country: warehouse.country ?? '',
            isActive: warehouse.isActive,
          }}
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Warehouse details</CardTitle>
          </CardHeader>
          <CardContent className='grid gap-4 sm:grid-cols-2'>
            <DetailField
              label='Address'
              value={warehouse.address ?? '—'}
            />
            <DetailField
              label='Postal code'
              value={warehouse.postalCode ?? '—'}
            />
            <DetailField
              label='Country'
              value={warehouse.country ?? '—'}
            />
          </CardContent>
        </Card>
      )}

      <div className='flex flex-col gap-4'>
        <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
          <div>
            <h2 className='font-heading text-xl font-semibold'>Stock locations</h2>
            <p className='text-sm text-muted-foreground'>
              Bin-level locations for putaway, picking, and stock tracking.
            </p>
          </div>
          {canManage ? (
            <Button asChild>
              <Link href={`/dashboard/warehouses/${warehouse.id}/locations/new`}>
                Add location
              </Link>
            </Button>
          ) : null}
        </div>
        <StockLocationTable
          warehouseId={warehouse.id}
          locations={warehouse.stockLocations}
          canManage={canManage}
        />
      </div>
    </div>
  );
}

function SummaryStat({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div className='space-y-1'>
      <p className='text-sm text-muted-foreground'>{label}</p>
      <div className='text-2xl font-semibold tabular-nums'>{value}</div>
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
