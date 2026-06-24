'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

import type { MembershipRole } from '@/app/generated/prisma/client';
import { inviteMemberAction } from '@/lib/actions/team';
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
import {
  type InviteMemberInput,
  inviteMemberSchema,
} from '@/lib/validations/team';

export function InviteMemberForm({
  assignableRoles,
}: {
  assignableRoles: MembershipRole[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const form = useForm<InviteMemberInput>({
    resolver: zodResolver(inviteMemberSchema),
    defaultValues: {
      email: '',
      role: (assignableRoles.includes('STAFF')
        ? 'STAFF'
        : assignableRoles[0] ?? 'VIEWER') as InviteMemberInput['role'],
    },
  });

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      try {
        await inviteMemberAction(values);
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
          error instanceof Error ? error.message : 'Unable to send invitation.'
        );
        router.refresh();
      }
    });
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Invite member</CardTitle>
        <CardDescription>
          Send an invite to an email that does not have an account yet. Existing
          users are added immediately and will not appear below.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={onSubmit}
          className='flex flex-col gap-4'
        >
          <FieldGroup className='grid gap-4 md:grid-cols-[2fr_1fr_auto]'>
            <Field data-invalid={!!form.formState.errors.email}>
              <FieldLabel htmlFor='email'>Email</FieldLabel>
              <Input
                id='email'
                type='email'
                placeholder='colleague@company.com'
                {...form.register('email')}
              />
              <FieldError errors={[form.formState.errors.email]} />
            </Field>
            <Field data-invalid={!!form.formState.errors.role}>
              <FieldLabel>Role</FieldLabel>
              <Select
                value={form.watch('role')}
                onValueChange={(value) =>
                  form.setValue('role', value as InviteMemberInput['role'], {
                    shouldValidate: true,
                  })
                }
              >
                <SelectTrigger className='w-full'>
                  <SelectValue placeholder='Select role' />
                </SelectTrigger>
                <SelectContent>
                  {assignableRoles.map((role) => (
                    <SelectItem
                      key={role}
                      value={role}
                    >
                      {role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError errors={[form.formState.errors.role]} />
            </Field>
            <div className='flex items-end'>
              <Button
                type='submit'
                disabled={isPending}
              >
                {isPending ? 'Inviting...' : 'Invite'}
              </Button>
            </div>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}
