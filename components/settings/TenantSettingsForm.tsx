'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

import { updateTenantSettingsAction } from '@/lib/actions/settings';
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
import {
  type UpdateTenantInput,
  updateTenantSchema,
} from '@/lib/validations/settings';

export function TenantSettingsForm({
  defaultValues,
  canEditSlug,
}: {
  defaultValues: UpdateTenantInput;
  canEditSlug: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const form = useForm<UpdateTenantInput>({
    resolver: zodResolver(updateTenantSchema),
    defaultValues,
  });

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      try {
        await updateTenantSettingsAction(values);
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
          error instanceof Error ? error.message : 'Unable to save settings.'
        );
      }
    });
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Organization</CardTitle>
        <CardDescription>
          Update your tenant display name and URL slug.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={onSubmit}
          className='flex flex-col gap-6'
        >
          <FieldGroup className='grid gap-6 md:grid-cols-2'>
            <Field data-invalid={!!form.formState.errors.name}>
              <FieldLabel htmlFor='name'>Organization name</FieldLabel>
              <Input
                id='name'
                {...form.register('name')}
              />
              <FieldError errors={[form.formState.errors.name]} />
            </Field>
            <Field data-invalid={!!form.formState.errors.slug}>
              <FieldLabel htmlFor='slug'>Slug</FieldLabel>
              <Input
                id='slug'
                {...form.register('slug')}
                disabled={!canEditSlug}
                className='lowercase'
              />
              <FieldDescription>
                {canEditSlug
                  ? 'Used in URLs. Lowercase letters, numbers, and hyphens only.'
                  : 'Only the organization owner can change the slug.'}
              </FieldDescription>
              <FieldError errors={[form.formState.errors.slug]} />
            </Field>
          </FieldGroup>
          <Button
            type='submit'
            disabled={isPending}
            className='w-fit'
          >
            {isPending ? 'Saving...' : 'Save organization'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
