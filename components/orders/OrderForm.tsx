'use client';

import { Plus, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

import { createOrderAction, updateOrderAction } from '@/lib/actions/orders';
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
import { type OrderInput, orderSchema } from '@/lib/validations/operations';

type InventoryOption = { id: string; label: string };

const emptyLine = { inventoryItemId: '', quantityOrdered: 1 };

const emptyValues: OrderInput = {
  notes: '',
  lines: [emptyLine],
};

export function OrderForm({
  orderId,
  inventoryItems,
  defaultValues,
}: {
  orderId?: string;
  inventoryItems: InventoryOption[];
  defaultValues?: Partial<OrderInput>;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const isEditing = Boolean(orderId);

  const form = useForm<OrderInput>({
    resolver: zodResolver(orderSchema),
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
        if (isEditing && orderId) {
          await updateOrderAction(orderId, values);
        } else {
          await createOrderAction(values);
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
          error instanceof Error ? error.message : 'Unable to save order.'
        );
      }
    });
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditing ? 'Edit order' : 'New order'}</CardTitle>
        <CardDescription>
          Create an outbound order. Confirm when ready for picking and shipping.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={onSubmit}
          className='flex flex-col gap-6'
        >
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
                className='grid gap-4 rounded-lg border p-4 md:grid-cols-[2fr_1fr_auto]'
              >
                <Field>
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
                <Field>
                  <FieldLabel>Qty ordered</FieldLabel>
                  <Input
                    type='number'
                    min={1}
                    {...form.register(`lines.${index}.quantityOrdered`, {
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
              {isPending ? 'Saving...' : isEditing ? 'Save changes' : 'Create order'}
            </Button>
            <Button
              type='button'
              variant='outline'
              disabled={isPending}
              onClick={() => router.push('/dashboard/orders')}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
