'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

import {
  createSupplierAction,
  updateSupplierAction,
} from '@/lib/actions/suppliers';
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
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { type SupplierInput, supplierSchema } from '@/lib/validations/operations';

const emptyValues: SupplierInput = {
  name: '',
  email: '',
  phone: '',
  address: '',
  notes: '',
  isActive: true,
};

export function SupplierForm({
  supplierId,
  defaultValues,
}: {
  supplierId?: string;
  defaultValues?: Partial<SupplierInput>;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const isEditing = Boolean(supplierId);

  const form = useForm<SupplierInput>({
    resolver: zodResolver(supplierSchema),
    defaultValues: { ...emptyValues, ...defaultValues },
  });

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      try {
        if (isEditing && supplierId) {
          await updateSupplierAction(supplierId, values);
        } else {
          await createSupplierAction(values);
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
          error instanceof Error ? error.message : 'Unable to save supplier.'
        );
      }
    });
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditing ? 'Supplier details' : 'New supplier'}</CardTitle>
        <CardDescription>
          {isEditing
            ? 'Update vendor contact information and status.'
            : 'Add a supplier for purchase orders and receiving.'}
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
            <Field data-invalid={!!form.formState.errors.email}>
              <FieldLabel htmlFor='email'>Email</FieldLabel>
              <Input
                id='email'
                type='email'
                {...form.register('email')}
              />
              <FieldError errors={[form.formState.errors.email]} />
            </Field>
            <Field data-invalid={!!form.formState.errors.phone}>
              <FieldLabel htmlFor='phone'>Phone</FieldLabel>
              <Input
                id='phone'
                {...form.register('phone')}
              />
              <FieldError errors={[form.formState.errors.phone]} />
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
            <Field
              className='md:col-span-2'
              data-invalid={!!form.formState.errors.notes}
            >
              <FieldLabel htmlFor='notes'>Notes</FieldLabel>
              <Textarea
                id='notes'
                rows={3}
                {...form.register('notes')}
              />
              <FieldError errors={[form.formState.errors.notes]} />
            </Field>
            <Field className='md:col-span-2'>
              <div className='flex items-center justify-between rounded-lg border p-4'>
                <div className='space-y-1'>
                  <FieldLabel htmlFor='isActive'>Active supplier</FieldLabel>
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
              {isPending ? 'Saving...' : isEditing ? 'Save changes' : 'Create supplier'}
            </Button>
            <Button
              type='button'
              variant='outline'
              disabled={isPending}
              onClick={() => router.push('/dashboard/suppliers')}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
