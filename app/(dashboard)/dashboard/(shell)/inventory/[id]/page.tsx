import Link from 'next/link';
import { notFound } from 'next/navigation';

import { InventoryItemForm } from '@/components/inventory/InventoryItemForm';
import { DashboardPageHeader } from '@/components/dashboard/DashboardPageHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { getInventoryItem } from '@/lib/inventory';
import { canManageInventory } from '@/lib/permissions';
import { requireTenantContext } from '@/lib/tenant-context';

type InventoryItemPageProps = {
  params: Promise<{ id: string }>;
};

export default async function InventoryItemPage({
  params,
}: InventoryItemPageProps) {
  const { tenant, role } = await requireTenantContext();
  const { id } = await params;
  const item = await getInventoryItem(tenant.id, id);

  if (!item) {
    notFound();
  }

  const canManage = canManageInventory(role);

  return (
    <div className='mx-auto flex w-full max-w-4xl flex-col gap-6'>
      <div className='flex items-center justify-between gap-4'>
        <DashboardPageHeader
          title={item.name}
          description={`SKU ${item.sku}`}
        />
        <Button
          variant='outline'
          asChild
        >
          <Link href='/dashboard/inventory'>Back to list</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Current stock</CardTitle>
          <CardDescription>
            Stock totals across all warehouse locations for this tenant.
          </CardDescription>
        </CardHeader>
        <CardContent className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
          <div>
            <p className='text-sm text-muted-foreground'>On hand</p>
            <p className='text-2xl font-semibold tabular-nums'>
              {item.quantityOnHand.toLocaleString()}
            </p>
          </div>
          <div>
            <p className='text-sm text-muted-foreground'>Available</p>
            <p className='text-2xl font-semibold tabular-nums'>
              {item.quantityAvailable.toLocaleString()}
            </p>
          </div>
          <div>
            <p className='text-sm text-muted-foreground'>Reserved</p>
            <p className='text-2xl font-semibold tabular-nums'>
              {item.quantityReserved.toLocaleString()}
            </p>
          </div>
          <div>
            <p className='text-sm text-muted-foreground'>Incoming</p>
            <div className='flex items-center gap-2'>
              <p className='text-2xl font-semibold tabular-nums'>
                {item.quantityIncoming.toLocaleString()}
              </p>
              {item.isLowStock ? (
                <Badge variant='destructive'>Low stock</Badge>
              ) : null}
            </div>
          </div>
        </CardContent>
      </Card>

      {canManage ? (
        <InventoryItemForm
          itemId={item.id}
          defaultValues={{
            sku: item.sku,
            name: item.name,
            description: item.description ?? '',
            category: item.category ?? '',
            unitOfMeasure: item.unitOfMeasure,
            reorderPoint: item.reorderPoint,
            barcode: item.barcode ?? '',
            status: item.status,
          }}
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Item details</CardTitle>
          </CardHeader>
          <CardContent className='grid gap-4 sm:grid-cols-2'>
            <DetailField
              label='Description'
              value={item.description ?? '—'}
            />
            <DetailField
              label='Category'
              value={item.category ?? '—'}
            />
            <DetailField
              label='Unit of measure'
              value={item.unitOfMeasure}
            />
            <DetailField
              label='Reorder point'
              value={item.reorderPoint.toLocaleString()}
            />
            <DetailField
              label='Barcode'
              value={item.barcode ?? '—'}
            />
            <DetailField
              label='Status'
              value={item.status}
            />
          </CardContent>
        </Card>
      )}
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
