'use client';

import { useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

import { updateProfileAction } from '@/lib/actions/settings';
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
  type UpdateProfileInput,
  updateProfileSchema,
} from '@/lib/validations/settings';

export function ProfileSettingsForm({
  defaultValues,
}: {
  defaultValues: UpdateProfileInput & { email: string };
}) {
  const [isPending, startTransition] = useTransition();

  const form = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      name: defaultValues.name,
    },
  });

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      try {
        await updateProfileAction(values);
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
          error instanceof Error ? error.message : 'Unable to update profile.'
        );
      }
    });
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your profile</CardTitle>
        <CardDescription>Update your account display name.</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={onSubmit}
          className='flex flex-col gap-6'
        >
          <FieldGroup className='grid gap-6 md:grid-cols-2'>
            <Field data-invalid={!!form.formState.errors.name}>
              <FieldLabel htmlFor='profile-name'>Name</FieldLabel>
              <Input
                id='profile-name'
                {...form.register('name')}
              />
              <FieldError errors={[form.formState.errors.name]} />
            </Field>
            <Field>
              <FieldLabel htmlFor='profile-email'>Email</FieldLabel>
              <Input
                id='profile-email'
                value={defaultValues.email}
                disabled
              />
            </Field>
          </FieldGroup>
          <Button
            type='submit'
            disabled={isPending}
            className='w-fit'
          >
            {isPending ? 'Saving...' : 'Save profile'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
