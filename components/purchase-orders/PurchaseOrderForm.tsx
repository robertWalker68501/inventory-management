'use client';

import Link from 'next/link';
import { Plus, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

import {
  createPurchaseOrderAction,
  updatePurchaseOrderAction,
} from '@/lib/actions/purchase-orders';
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
  type PurchaseOrderInput,
  purchaseOrderSchema,
} from '@/lib/validations/operations';

type Option = { id: string; label: string };

type PurchaseOrderFormProps = {
  purchaseOrderId?: string;
  suppliers: Option[];
  inventoryItems: Option[];
  defaultValues?: Partial<PurchaseOrderInput>;
};

const emptyLine = {
  inventoryItemId: '',
  quantityOrdered: 1,
  unitCost: undefined as number | undefined,
};

const emptyValues: PurchaseOrderInput = {
  supplierId: '',
  expectedAt: '',
  notes: '',
  lines: [emptyLine],
};

export function PurchaseOrderForm({
  purchaseOrderId,
  suppliers,
  inventoryItems,
  defaultValues,
}: PurchaseOrderFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const isEditing = Boolean(purchaseOrderId);

  const form = useForm<PurchaseOrderInput>({
    resolver: zodResolver(purchaseOrderSchema),
    defaultValues: {
      ...emptyValues,
      ...defaultValues,
      lines: defaultValues?.lines?.length ? defaultValues.lines : [emptyLine],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'lines',
  });

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      try {
        if (isEditing && purchaseOrderId) {
          await updatePurchaseOrderAction(purchaseOrderId, values);
        } else {
          await createPurchaseOrderAction(values);
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
          error instanceof Error ? error.message : 'Unable to save purchase order.'
        );
      }
    });
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {isEditing ? 'Edit purchase order' : 'New purchase order'}
        </CardTitle>
        <CardDescription>
          Add line items from your inventory catalog. Submit when ready to send to
          the supplier.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={onSubmit}
          className='flex flex-col gap-6'
        >
          <FieldGroup className='grid gap-6 md:grid-cols-2'>
            <Field data-invalid={!!form.formState.errors.supplierId}>
              <FieldLabel>Supplier</FieldLabel>
              <Select
                value={form.watch('supplierId')}
                onValueChange={(value) =>
                  form.setValue('supplierId', value, { shouldValidate: true })
                }
              >
                <SelectTrigger className='w-full'>
                  <SelectValue placeholder='Select supplier' />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((supplier) => (
                    <SelectItem
                      key={supplier.id}
                      value={supplier.id}
                    >
                      {supplier.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError errors={[form.formState.errors.supplierId]} />
            </Field>
            <Field data-invalid={!!form.formState.errors.expectedAt}>
              <FieldLabel htmlFor='expectedAt'>Expected delivery</FieldLabel>
              <Input
                id='expectedAt'
                type='date'
                {...form.register('expectedAt')}
              />
              <FieldError errors={[form.formState.errors.expectedAt]} />
            </Field>
            <Field
              className='md:col-span-2'
              data-invalid={!!form.formState.errors.notes}
            >
              <FieldLabel htmlFor='notes'>Notes</FieldLabel>
              <Textarea
                id='notes'
                rows={2}
                {...form.register('notes')}
              />
              <FieldError errors={[form.formState.errors.notes]} />
            </Field>
          </FieldGroup>

          <div className='space-y-4'>
            <div className='flex items-center justify-between'>
              <h3 className='font-medium'>Line items</h3>
              <Button
                type='button'
                variant='outline'
                size='sm'
                onClick={() => append(emptyLine)}
              >
                <Plus className='size-4' />
                Add line
              </Button>
            </div>
            {fields.map((field, index) => (
              <div
                key={field.id}
                className='grid gap-4 rounded-lg border p-4 md:grid-cols-[2fr_1fr_1fr_auto]'
              >
                <Field data-invalid={!!form.formState.errors.lines?.[index]?.inventoryItemId}>
                  <FieldLabel>Item</FieldLabel>
                  <Select
                    value={form.watch(`lines.${index}.inventoryItemId`)}
                    onValueChange={(value) =>
                      form.setValue(`lines.${index}.inventoryItemId`, value, {
                        shouldValidate: true,
                      })
                    }
                  >
                    <SelectTrigger className='w-full'>
                      <SelectValue placeholder='Select item' />
                    </SelectTrigger>
                    <SelectContent>
                      {inventoryItems.map((item) => (
                        <SelectItem
                          key={item.id}
                          value={item.id}
                        >
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field data-invalid={!!form.formState.errors.lines?.[index]?.quantityOrdered}>
                  <FieldLabel>Qty</FieldLabel>
                  <Input
                    type='number'
                    min={1}
                    {...form.register(`lines.${index}.quantityOrdered`, {
                      valueAsNumber: true,
                    })}
                  />
                </Field>
                <Field>
                  <FieldLabel>Unit cost</FieldLabel>
                  <Input
                    type='number'
                    min={0}
                    step='0.01'
                    {...form.register(`lines.${index}.unitCost`, {
                      valueAsNumber: true,
                    })}
                  />
                </Field>
                <div className='flex items-end'>
                  <Button
                    type='button'
                    variant='ghost'
                    size='icon'
                    disabled={fields.length === 1}
                    onClick={() => remove(index)}
                  >
                    <Trash2 className='size-4' />
                  </Button>
                </div>
              </div>
            ))}
            <FieldError errors={[form.formState.errors.lines]} />
          </div>

          <div className='flex flex-wrap gap-3'>
            <Button
              type='submit'
              disabled={isPending}
            >
              {isPending ? 'Saving...' : isEditing ? 'Save changes' : 'Create PO'}
            </Button>
            <Button
              type='button'
              variant='outline'
              disabled={isPending}
              onClick={() => router.push('/dashboard/purchase-orders')}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
