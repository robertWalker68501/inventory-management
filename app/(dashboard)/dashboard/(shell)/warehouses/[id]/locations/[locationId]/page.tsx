import Link from 'next/link';
import { notFound } from 'next/navigation';

import { DashboardPageHeader } from '@/components/dashboard/DashboardPageHeader';
import { StockLocationForm } from '@/components/warehouses/StockLocationForm';
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
import { canManageWarehouses } from '@/lib/permissions';
import { requireTenantContext } from '@/lib/tenant-context';
import { getStockLocation, getWarehouse } from '@/lib/warehouses';
import { formatBinLabel } from '@/lib/validations/warehouse';

type StockLocationDetailPageProps = {
  params: Promise<{ id: string; locationId: string }>;
};

type AssignedStock = NonNullable<
  Awaited<ReturnType<typeof getStockLocation>>
>['inventoryStocks'][number];

export default async function StockLocationDetailPage({
  params,
}: StockLocationDetailPageProps) {
  const { tenant, role } = await requireTenantContext();
  const { id, locationId } = await params;
  const canManage = canManageWarehouses(role);

  const warehouse = await getWarehouse(tenant.id, id);

  if (!warehouse) {
    notFound();
  }

  const location = await getStockLocation(tenant.id, id, locationId);

  if (!location) {
    notFound();
  }

  if (!canManage) {
    return (
      <div className='flex flex-col gap-6'>
        <div className='flex items-center justify-between gap-4'>
          <DashboardPageHeader
            title={formatBinLabel(location)}
            description={`${warehouse.name} · ${warehouse.code}`}
          />
          <Button
            variant='outline'
            asChild
          >
            <Link href={`/dashboard/warehouses/${warehouse.id}`}>Back</Link>
          </Button>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Location details</CardTitle>
          </CardHeader>
          <CardContent className='grid gap-4 sm:grid-cols-2'>
            <DetailField
              label='Aisle'
              value={location.aisle ?? '—'}
            />
            <DetailField
              label='Rack'
              value={location.rack ?? '—'}
            />
            <DetailField
              label='Bin'
              value={location.bin ?? '—'}
            />
            <DetailField
              label='Status'
              value={location.isActive ? 'Active' : 'Inactive'}
            />
          </CardContent>
        </Card>
        <AssignedStockTable stocks={location.inventoryStocks} />
      </div>
    );
  }

  return (
    <div className='mx-auto flex w-full max-w-4xl flex-col gap-6'>
      <div className='flex items-center justify-between gap-4'>
        <DashboardPageHeader
          title={formatBinLabel(location)}
          description={`${warehouse.name} · ${warehouse.code}`}
        />
        <Button
          variant='outline'
          asChild
        >
          <Link href={`/dashboard/warehouses/${warehouse.id}`}>Back to warehouse</Link>
        </Button>
      </div>

      <AssignedStockTable stocks={location.inventoryStocks} />

      <StockLocationForm
        warehouseId={warehouse.id}
        locationId={location.id}
        defaultValues={{
          name: location.name,
          aisle: location.aisle ?? '',
          rack: location.rack ?? '',
          bin: location.bin ?? '',
          isActive: location.isActive,
        }}
      />
    </div>
  );
}

function AssignedStockTable({ stocks }: { stocks: AssignedStock[] }) {
  if (stocks.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Assigned inventory</CardTitle>
          <CardDescription>No stock is currently stored at this location.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Assigned inventory</CardTitle>
        <CardDescription>SKUs currently stored at this bin location.</CardDescription>
      </CardHeader>
      <CardContent className='px-0 pb-0'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>SKU</TableHead>
              <TableHead>Item</TableHead>
              <TableHead className='text-right'>On hand</TableHead>
              <TableHead className='text-right'>Reserved</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {stocks.map((stock) => (
              <TableRow key={stock.id}>
                <TableCell className='font-medium'>
                  {stock.inventoryItem.sku}
                </TableCell>
                <TableCell>{stock.inventoryItem.name}</TableCell>
                <TableCell className='text-right tabular-nums'>
                  {stock.quantityOnHand.toLocaleString()}{' '}
                  {stock.inventoryItem.unitOfMeasure}
                </TableCell>
                <TableCell className='text-right tabular-nums'>
                  {stock.quantityReserved.toLocaleString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
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
