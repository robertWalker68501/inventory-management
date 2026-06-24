'use client';

import { Plus, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useTransition } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

import {
  createReceivingAction,
  updateReceivingAction,
} from '@/lib/actions/receiving';
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
  type ReceivingInput,
  receivingSchema,
} from '@/lib/validations/operations';

type WarehouseOption = { id: string; label: string };
type LocationOption = { id: string; name: string; warehouseId: string };
type InventoryOption = { id: string; label: string };
type PurchaseOrderOption = {
  id: string;
  number: string;
  lines: {
    id: string;
    inventoryItemId: string;
    quantityOrdered: number;
    quantityReceived: number;
    itemLabel: string;
  }[];
};

type ReceivingFormProps = {
  receivingId?: string;
  warehouses: WarehouseOption[];
  locations: LocationOption[];
  inventoryItems: InventoryOption[];
  purchaseOrders: PurchaseOrderOption[];
  defaultValues?: Partial<ReceivingInput>;
  initialPurchaseOrderId?: string;
};

const emptyLine = {
  inventoryItemId: '',
  purchaseOrderLineId: '',
  stockLocationId: '',
  quantityReceived: 0,
};

const emptyValues: ReceivingInput = {
  warehouseId: '',
  purchaseOrderId: '',
  notes: '',
  lines: [emptyLine],
};

export function ReceivingForm({
  receivingId,
  warehouses,
  locations,
  inventoryItems,
  purchaseOrders,
  defaultValues,
  initialPurchaseOrderId,
}: ReceivingFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const isEditing = Boolean(receivingId);

  const form = useForm<ReceivingInput>({
    resolver: zodResolver(receivingSchema),
    defaultValues: {
      ...emptyValues,
      purchaseOrderId: initialPurchaseOrderId ?? '',
      ...defaultValues,
      lines: defaultValues?.lines?.length ? defaultValues.lines : [emptyLine],
    },
  });

  const { fields, append, remove, replace } = useFieldArray({
    control: form.control,
    name: 'lines',
  });

  const warehouseId = form.watch('warehouseId');
  const purchaseOrderId = form.watch('purchaseOrderId');
  const warehouseLocations = locations.filter(
    (location) => location.warehouseId === warehouseId
  );

  useEffect(() => {
    if (!purchaseOrderId || isEditing) {
      return;
    }

    const po = purchaseOrders.find((order) => order.id === purchaseOrderId);

    if (!po) {
      return;
    }

    const openLines = po.lines
      .filter((line) => line.quantityReceived < line.quantityOrdered)
      .map((line) => ({
        inventoryItemId: line.inventoryItemId,
        purchaseOrderLineId: line.id,
        stockLocationId: '',
        quantityReceived: line.quantityOrdered - line.quantityReceived,
      }));

    if (openLines.length > 0) {
      replace(openLines);
    }
  }, [purchaseOrderId, purchaseOrders, replace, isEditing]);

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      try {
        const payload = {
          ...values,
          purchaseOrderId: values.purchaseOrderId || undefined,
          lines: values.lines.map((line) => ({
            ...line,
            purchaseOrderLineId: line.purchaseOrderLineId || undefined,
            stockLocationId: line.stockLocationId || undefined,
          })),
        };

        if (isEditing && receivingId) {
          await updateReceivingAction(receivingId, payload);
        } else {
          await createReceivingAction(payload);
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
          error instanceof Error ? error.message : 'Unable to save receiving.'
        );
      }
    });
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditing ? 'Edit receiving' : 'New receiving'}</CardTitle>
        <CardDescription>
          Record inbound goods and assign them to stock locations. Completing a
          receiving updates on-hand inventory.
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
              <FieldLabel>Purchase order (optional)</FieldLabel>
              <Select
                value={form.watch('purchaseOrderId') || 'none'}
                onValueChange={(value) =>
                  form.setValue(
                    'purchaseOrderId',
                    value === 'none' ? '' : value,
                    { shouldValidate: true }
                  )
                }
              >
                <SelectTrigger className='w-full'>
                  <SelectValue placeholder='Standalone receiving' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='none'>Standalone receiving</SelectItem>
                  {purchaseOrders.map((po) => (
                    <SelectItem
                      key={po.id}
                      value={po.id}
                    >
                      {po.number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
              <h3 className='font-medium'>Received lines</h3>
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
                className='grid gap-4 rounded-lg border p-4 md:grid-cols-[2fr_1fr_1fr_1fr_auto]'
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
                  <FieldLabel>Location</FieldLabel>
                  <Select
                    value={form.watch(`lines.${index}.stockLocationId`) || 'none'}
                    onValueChange={(value) =>
                      form.setValue(
                        `lines.${index}.stockLocationId`,
                        value === 'none' ? '' : value,
                        { shouldValidate: true }
                      )
                    }
                    disabled={!warehouseId}
                  >
                    <SelectTrigger className='w-full'>
                      <SelectValue placeholder='Select bin' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='none'>Select location</SelectItem>
                      {warehouseLocations.map((location) => (
                        <SelectItem
                          key={location.id}
                          value={location.id}
                        >
                          {location.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field>
                  <FieldLabel>Qty received</FieldLabel>
                  <Input
                    type='number'
                    min={0}
                    {...form.register(`lines.${index}.quantityReceived`, {
                      valueAsNumber: true,
                    })}
                  />
                </Field>
                <div className='hidden'>
                  <Input
                    {...form.register(`lines.${index}.purchaseOrderLineId`)}
                  />
                </div>
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
              {isPending ? 'Saving...' : isEditing ? 'Save changes' : 'Create receiving'}
            </Button>
            <Button
              type='button'
              variant='outline'
              disabled={isPending}
              onClick={() => router.push('/dashboard/receiving')}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
