'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

import {
  createStockLocationAction,
  updateStockLocationAction,
} from '@/lib/actions/warehouses';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  type StockLocationInput,
  stockLocationSchema,
} from '@/lib/validations/warehouse';

const emptyValues: StockLocationInput = {
  name: '',
  aisle: '',
  rack: '',
  bin: '',
  isActive: true,
};

function buildLocationName(aisle?: string, rack?: string, bin?: string) {
  return [aisle, rack, bin].filter(Boolean).join('-');
}

export function StockLocationForm({
  warehouseId,
  locationId,
  defaultValues,
}: {
  warehouseId: string;
  locationId?: string;
  defaultValues?: Partial<StockLocationInput>;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const isEditing = Boolean(locationId);

  const form = useForm<StockLocationInput>({
    resolver: zodResolver(stockLocationSchema),
    defaultValues: {
      ...emptyValues,
      ...defaultValues,
    },
  });

  const aisle = form.watch('aisle');
  const rack = form.watch('rack');
  const bin = form.watch('bin');
  const name = form.watch('name');

  useEffect(() => {
    if (isEditing || name.trim()) {
      return;
    }

    const suggested = buildLocationName(aisle, rack, bin);
    if (suggested) {
      form.setValue('name', suggested, { shouldDirty: true });
    }
  }, [aisle, rack, bin, form, isEditing, name]);

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      try {
        if (isEditing && locationId) {
          await updateStockLocationAction(warehouseId, locationId, values);
        } else {
          await createStockLocationAction(warehouseId, values);
        }
      } catch (error) {
        if (
          typeof error === 'object' &&
          error !== null &&
          'digest' in error &&
          typeof error.digest === 'string' &&
          error.digest.startsWith('NEXT_REDIRECT')
        ) {
          throw error;
        }

        toast.error(
          error instanceof Error ? error.message : 'Unable to save location.'
        );
      }
    });
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {isEditing ? 'Edit stock location' : 'New stock location'}
        </CardTitle>
        <CardDescription>
          Define aisle, rack, and bin coordinates for warehouse putaway and picking.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={onSubmit}
          className='flex flex-col gap-6'
        >
          <FieldGroup className='grid gap-6 md:grid-cols-2'>
            <Field data-invalid={!!form.formState.errors.aisle}>
              <FieldLabel htmlFor='aisle'>Aisle</FieldLabel>
              <Input
                id='aisle'
                placeholder='A'
                {...form.register('aisle')}
              />
              <FieldError errors={[form.formState.errors.aisle]} />
            </Field>
            <Field data-invalid={!!form.formState.errors.rack}>
              <FieldLabel htmlFor='rack'>Rack</FieldLabel>
              <Input
                id='rack'
                placeholder='01'
                {...form.register('rack')}
              />
              <FieldError errors={[form.formState.errors.rack]} />
            </Field>
            <Field data-invalid={!!form.formState.errors.bin}>
              <FieldLabel htmlFor='bin'>Bin</FieldLabel>
              <Input
                id='bin'
                placeholder='01'
                {...form.register('bin')}
              />
              <FieldError errors={[form.formState.errors.bin]} />
            </Field>
            <Field data-invalid={!!form.formState.errors.name}>
              <FieldLabel htmlFor='name'>Location name</FieldLabel>
              <Input
                id='name'
                placeholder='A-01-01'
                {...form.register('name')}
              />
              <FieldDescription>
                Unique within this warehouse. Auto-filled from aisle/rack/bin when empty.
              </FieldDescription>
              <FieldError errors={[form.formState.errors.name]} />
            </Field>
            <Field className='md:col-span-2'>
              <div className='flex items-center justify-between rounded-lg border p-4'>
                <div className='space-y-1'>
                  <FieldLabel htmlFor='locationActive'>Active location</FieldLabel>
                  <FieldDescription>
                    Inactive locations cannot receive new stock assignments.
                  </FieldDescription>
                </div>
                <Switch
                  id='locationActive'
                  checked={form.watch('isActive')}
                  onCheckedChange={(checked) =>
                    form.setValue('isActive', checked, { shouldValidate: true })
                  }
                />
              </div>
            </Field>
          </FieldGroup>
          <div className='flex flex-wrap gap-3'>
            <Button
              type='submit'
              disabled={isPending}
            >
              {isPending
                ? 'Saving...'
                : isEditing
                  ? 'Save location'
                  : 'Create location'}
            </Button>
            <Button
              type='button'
              variant='outline'
              disabled={isPending}
              onClick={() => router.push(`/dashboard/warehouses/${warehouseId}`)}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
