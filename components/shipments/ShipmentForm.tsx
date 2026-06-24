'use client';

import { Plus, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useTransition } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

import {
  createShipmentAction,
  updateShipmentAction,
} from '@/lib/actions/shipments';
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
  type ShipmentInput,
  shipmentSchema,
} from '@/lib/validations/operations';

type WarehouseOption = { id: string; label: string };
type InventoryOption = { id: string; label: string };
type OrderOption = {
  id: string;
  number: string;
  lines: {
    id: string;
    inventoryItemId: string;
    quantityOrdered: number;
    quantityPicked: number;
    quantityShipped: number;
    itemLabel: string;
  }[];
};

const emptyLine = {
  orderLineId: '',
  inventoryItemId: '',
  quantityShipped: 0,
};

const emptyValues: ShipmentInput = {
  orderId: '',
  warehouseId: '',
  trackingNumber: '',
  notes: '',
  lines: [emptyLine],
};

export function ShipmentForm({
  shipmentId,
  warehouses,
  inventoryItems,
  orders,
  defaultValues,
  initialOrderId,
}: {
  shipmentId?: string;
  warehouses: WarehouseOption[];
  inventoryItems: InventoryOption[];
  orders: OrderOption[];
  defaultValues?: Partial<ShipmentInput>;
  initialOrderId?: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const isEditing = Boolean(shipmentId);

  const form = useForm<ShipmentInput>({
    resolver: zodResolver(shipmentSchema),
    defaultValues: {
      ...emptyValues,
      orderId: initialOrderId ?? '',
      ...defaultValues,
      lines: defaultValues?.lines?.length ? defaultValues.lines : [emptyLine],
    },
  });

  const { fields, append, remove, replace } = useFieldArray({
    control: form.control,
    name: 'lines',
  });

  const orderId = form.watch('orderId');

  useEffect(() => {
    if (!orderId || isEditing) {
      return;
    }

    const order = orders.find((item) => item.id === orderId);

    if (!order) {
      return;
    }

    const shippableLines = order.lines
      .filter((line) => line.quantityPicked > line.quantityShipped)
      .map((line) => ({
        orderLineId: line.id,
        inventoryItemId: line.inventoryItemId,
        quantityShipped: line.quantityPicked - line.quantityShipped,
      }));

    if (shippableLines.length > 0) {
      replace(shippableLines);
    }
  }, [orderId, orders, replace, isEditing]);

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      try {
        const payload = {
          ...values,
          orderId: values.orderId || undefined,
          lines: values.lines.map((line) => ({
            ...line,
            orderLineId: line.orderLineId || undefined,
          })),
        };

        if (isEditing && shipmentId) {
          await updateShipmentAction(shipmentId, payload);
        } else {
          await createShipmentAction(payload);
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
          error instanceof Error ? error.message : 'Unable to save shipment.'
        );
      }
    });
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditing ? 'Edit shipment' : 'New shipment'}</CardTitle>
        <CardDescription>
          Ship picked items from a warehouse. Shipping deducts on-hand inventory.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={onSubmit}
          className='flex flex-col gap-6'
        >
          <FieldGroup className='grid gap-6 md:grid-cols-2'>
            <Field data-invalid={!!form.formState.errors.warehouseId}>
              <FieldLabel>Warehouse</FieldLabel>
              <Select
                value={form.watch('warehouseId')}
                onValueChange={(value) =>
                  form.setValue('warehouseId', value, { shouldValidate: true })
                }
              >
                <SelectTrigger className='w-full'>
                  <SelectValue placeholder='Select warehouse' />
                </SelectTrigger>
                <SelectContent>
                  {warehouses.map((warehouse) => (
                    <SelectItem
                      key={warehouse.id}
                      value={warehouse.id}
                    >
                      {warehouse.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError errors={[form.formState.errors.warehouseId]} />
            </Field>
            <Field>
              <FieldLabel>Order (optional)</FieldLabel>
              <Select
                value={form.watch('orderId') || 'none'}
                onValueChange={(value) =>
                  form.setValue('orderId', value === 'none' ? '' : value, {
                    shouldValidate: true,
                  })
                }
              >
                <SelectTrigger className='w-full'>
                  <SelectValue placeholder='Standalone shipment' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='none'>Standalone shipment</SelectItem>
                  {orders.map((order) => (
                    <SelectItem
                      key={order.id}
                      value={order.id}
                    >
                      {order.number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field data-invalid={!!form.formState.errors.trackingNumber}>
              <FieldLabel htmlFor='trackingNumber'>Tracking number</FieldLabel>
              <Input
                id='trackingNumber'
                {...form.register('trackingNumber')}
              />
              <FieldError errors={[form.formState.errors.trackingNumber]} />
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
              <h3 className='font-medium'>Shipment lines</h3>
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
                  <FieldLabel>Qty shipped</FieldLabel>
                  <Input
                    type='number'
                    min={0}
                    {...form.register(`lines.${index}.quantityShipped`, {
                      valueAsNumber: true,
                    })}
                  />
                </Field>
                <input
                  type='hidden'
                  {...form.register(`lines.${index}.orderLineId`)}
                />
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
              {isPending ? 'Saving...' : isEditing ? 'Save changes' : 'Create shipment'}
            </Button>
            <Button
              type='button'
              variant='outline'
              disabled={isPending}
              onClick={() => router.push('/dashboard/shipments')}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
