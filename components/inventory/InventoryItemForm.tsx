'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

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
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  createInventoryItemAction,
  updateInventoryItemAction,
} from '@/lib/actions/inventory';
import {
  type InventoryItemInput,
  inventoryItemSchema,
  inventoryItemStatuses,
} from '@/lib/validations/inventory';

type InventoryItemFormProps = {
  itemId?: string;
  defaultValues?: Partial<InventoryItemInput>;
};

const emptyValues: InventoryItemInput = {
  sku: '',
  name: '',
  description: '',
  category: '',
  unitOfMeasure: 'each',
  reorderPoint: 0,
  barcode: '',
  status: 'ACTIVE',
};

export function InventoryItemForm({
  itemId,
  defaultValues,
}: InventoryItemFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const isEditing = Boolean(itemId);

  const form = useForm<InventoryItemInput>({
    resolver: zodResolver(inventoryItemSchema),
    defaultValues: {
      ...emptyValues,
      ...defaultValues,
    },
  });

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      try {
        if (isEditing && itemId) {
          await updateInventoryItemAction(itemId, values);
        } else {
          await createInventoryItemAction(values);
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
          error instanceof Error ? error.message : 'Unable to save item.'
        );
      }
    });
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditing ? 'Edit inventory item' : 'New inventory item'}</CardTitle>
        <CardDescription>
          {isEditing
            ? 'Update catalog details and replenishment settings.'
            : 'Add a SKU to your tenant catalog. Stock can be assigned to warehouses later.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={onSubmit}
          className='flex flex-col gap-6'
        >
          <FieldGroup className='grid gap-6 md:grid-cols-2'>
            <Field data-invalid={!!form.formState.errors.sku}>
              <FieldLabel htmlFor='sku'>SKU</FieldLabel>
              <Input
                id='sku'
                {...form.register('sku')}
              />
              <FieldError errors={[form.formState.errors.sku]} />
            </Field>
            <Field data-invalid={!!form.formState.errors.name}>
              <FieldLabel htmlFor='name'>Name</FieldLabel>
              <Input
                id='name'
                {...form.register('name')}
              />
              <FieldError errors={[form.formState.errors.name]} />
            </Field>
            <Field
              className='md:col-span-2'
              data-invalid={!!form.formState.errors.description}
            >
              <FieldLabel htmlFor='description'>Description</FieldLabel>
              <Textarea
                id='description'
                rows={3}
                {...form.register('description')}
              />
              <FieldError errors={[form.formState.errors.description]} />
            </Field>
            <Field data-invalid={!!form.formState.errors.category}>
              <FieldLabel htmlFor='category'>Category</FieldLabel>
              <Input
                id='category'
                {...form.register('category')}
              />
              <FieldError errors={[form.formState.errors.category]} />
            </Field>
            <Field data-invalid={!!form.formState.errors.unitOfMeasure}>
              <FieldLabel htmlFor='unitOfMeasure'>Unit of measure</FieldLabel>
              <Input
                id='unitOfMeasure'
                {...form.register('unitOfMeasure')}
              />
              <FieldError errors={[form.formState.errors.unitOfMeasure]} />
            </Field>
            <Field data-invalid={!!form.formState.errors.reorderPoint}>
              <FieldLabel htmlFor='reorderPoint'>Reorder point</FieldLabel>
              <Input
                id='reorderPoint'
                type='number'
                min={0}
                {...form.register('reorderPoint', { valueAsNumber: true })}
              />
              <FieldError errors={[form.formState.errors.reorderPoint]} />
            </Field>
            <Field data-invalid={!!form.formState.errors.barcode}>
              <FieldLabel htmlFor='barcode'>Barcode</FieldLabel>
              <Input
                id='barcode'
                {...form.register('barcode')}
              />
              <FieldError errors={[form.formState.errors.barcode]} />
            </Field>
            <Field data-invalid={!!form.formState.errors.status}>
              <FieldLabel>Status</FieldLabel>
              <Select
                value={form.watch('status')}
                onValueChange={(value) =>
                  form.setValue('status', value as InventoryItemInput['status'], {
                    shouldValidate: true,
                  })
                }
              >
                <SelectTrigger className='w-full'>
                  <SelectValue placeholder='Select status' />
                </SelectTrigger>
                <SelectContent>
                  {inventoryItemStatuses.map((status) => (
                    <SelectItem
                      key={status}
                      value={status}
                    >
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError errors={[form.formState.errors.status]} />
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
                  : 'Create item'}
            </Button>
            <Button
              type='button'
              variant='outline'
              disabled={isPending}
              onClick={() => router.push('/dashboard/inventory')}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
