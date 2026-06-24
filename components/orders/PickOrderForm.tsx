'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

import { pickOrderAction } from '@/lib/actions/orders';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { pickOrderSchema, type PickOrderInput } from '@/lib/validations/operations';

type PickLine = {
  orderLineId: string;
  sku: string;
  name: string;
  unitOfMeasure: string;
  quantityOrdered: number;
  quantityPicked: number;
  quantityShipped: number;
};

export function PickOrderForm({
  orderId,
  lines,
}: {
  orderId: string;
  lines: PickLine[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const form = useForm<PickOrderInput>({
    resolver: zodResolver(pickOrderSchema),
    defaultValues: {
      lines: lines.map((line) => ({
        orderLineId: line.orderLineId,
        quantityPicked: line.quantityPicked,
      })),
    },
  });

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      try {
        await pickOrderAction(orderId, values);
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
          error instanceof Error ? error.message : 'Unable to update picking.'
        );
      }
    });
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Picking</CardTitle>
        <CardDescription>
          Record picked quantities for each line. Order status updates to Picking
          or Packed when saved.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={onSubmit}
          className='flex flex-col gap-6'
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU</TableHead>
                <TableHead>Item</TableHead>
                <TableHead className='text-right'>Ordered</TableHead>
                <TableHead className='text-right'>Shipped</TableHead>
                <TableHead className='text-right'>Picked</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lines.map((line, index) => (
                <TableRow key={line.orderLineId}>
                  <TableCell className='font-medium'>{line.sku}</TableCell>
                  <TableCell>{line.name}</TableCell>
                  <TableCell className='text-right tabular-nums'>
                    {line.quantityOrdered} {line.unitOfMeasure}
                  </TableCell>
                  <TableCell className='text-right tabular-nums'>
                    {line.quantityShipped}
                  </TableCell>
                  <TableCell className='text-right'>
                    <Field>
                      <FieldLabel className='sr-only'>Picked quantity</FieldLabel>
                      <Input
                        type='number'
                        min={line.quantityShipped}
                        max={line.quantityOrdered}
                        className='ml-auto w-24 text-right'
                        {...form.register(`lines.${index}.quantityPicked`, {
                          valueAsNumber: true,
                        })}
                      />
                      <input
                        type='hidden'
                        {...form.register(`lines.${index}.orderLineId`)}
                        value={line.orderLineId}
                      />
                    </Field>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Button
            type='submit'
            disabled={isPending}
          >
            {isPending ? 'Saving...' : 'Save picking'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
