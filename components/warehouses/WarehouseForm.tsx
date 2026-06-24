'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

import {
  createWarehouseAction,
  updateWarehouseAction,
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
  type WarehouseInput,
  warehouseSchema,
} from '@/lib/validations/warehouse';

const emptyValues: WarehouseInput = {
  name: '',
  code: '',
  address: '',
  city: '',
  state: '',
  postalCode: '',
  country: '',
  isActive: true,
};

export function WarehouseForm({
  warehouseId,
  defaultValues,
}: {
  warehouseId?: string;
  defaultValues?: Partial<WarehouseInput>;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const isEditing = Boolean(warehouseId);

  const form = useForm<WarehouseInput>({
    resolver: zodResolver(warehouseSchema),
    defaultValues: {
      ...emptyValues,
      ...defaultValues,
    },
  });

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      try {
        if (isEditing && warehouseId) {
          await updateWarehouseAction(warehouseId, values);
        } else {
          await createWarehouseAction(values);
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
          error instanceof Error ? error.message : 'Unable to save warehouse.'
        );
      }
    });
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditing ? 'Warehouse details' : 'New warehouse'}</CardTitle>
        <CardDescription>
          {isEditing
            ? 'Update warehouse profile and operational status.'
            : 'Create a warehouse to organize stock locations and bins.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={onSubmit}
          className='flex flex-col gap-6'
        >
          <FieldGroup className='grid gap-6 md:grid-cols-2'>
            <Field data-invalid={!!form.formState.errors.name}>
              <FieldLabel htmlFor='name'>Name</FieldLabel>
              <Input
                id='name'
                {...form.register('name')}
              />
              <FieldError errors={[form.formState.errors.name]} />
            </Field>
            <Field data-invalid={!!form.formState.errors.code}>
              <FieldLabel htmlFor='code'>Code</FieldLabel>
              <Input
                id='code'
                {...form.register('code')}
                className='uppercase'
              />
              <FieldDescription>Unique per organization, e.g. WH-MAIN</FieldDescription>
              <FieldError errors={[form.formState.errors.code]} />
            </Field>
            <Field
              className='md:col-span-2'
              data-invalid={!!form.formState.errors.address}
            >
              <FieldLabel htmlFor='address'>Address</FieldLabel>
              <Input
                id='address'
                {...form.register('address')}
              />
              <FieldError errors={[form.formState.errors.address]} />
            </Field>
            <Field data-invalid={!!form.formState.errors.city}>
              <FieldLabel htmlFor='city'>City</FieldLabel>
              <Input
                id='city'
                {...form.register('city')}
              />
              <FieldError errors={[form.formState.errors.city]} />
            </Field>
            <Field data-invalid={!!form.formState.errors.state}>
              <FieldLabel htmlFor='state'>State</FieldLabel>
              <Input
                id='state'
                {...form.register('state')}
              />
              <FieldError errors={[form.formState.errors.state]} />
            </Field>
            <Field data-invalid={!!form.formState.errors.postalCode}>
              <FieldLabel htmlFor='postalCode'>Postal code</FieldLabel>
              <Input
                id='postalCode'
                {...form.register('postalCode')}
              />
              <FieldError errors={[form.formState.errors.postalCode]} />
            </Field>
            <Field data-invalid={!!form.formState.errors.country}>
              <FieldLabel htmlFor='country'>Country</FieldLabel>
              <Input
                id='country'
                {...form.register('country')}
              />
              <FieldError errors={[form.formState.errors.country]} />
            </Field>
            <Field className='md:col-span-2'>
              <div className='flex items-center justify-between rounded-lg border p-4'>
                <div className='space-y-1'>
                  <FieldLabel htmlFor='isActive'>Active warehouse</FieldLabel>
                  <FieldDescription>
                    Inactive warehouses are hidden from operational workflows.
                  </FieldDescription>
                </div>
                <Switch
                  id='isActive'
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
                  ? 'Save changes'
                  : 'Create warehouse'}
            </Button>
            <Button
              type='button'
              variant='outline'
              disabled={isPending}
              onClick={() => router.push('/dashboard/warehouses')}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
