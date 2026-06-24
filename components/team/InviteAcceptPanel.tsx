'use client';

import Link from 'next/link';
import { useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

import { acceptInvitationAction, inviteSignUpAction } from '@/lib/actions/team';
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
  type InviteSignUpInput,
  inviteSignUpSchema,
} from '@/lib/validations/team';

export function InviteAcceptPanel({
  token,
  tenantName,
  role,
  email,
  isLoggedIn,
  loggedInEmail,
}: {
  token: string;
  tenantName: string;
  role: string;
  email: string;
  isLoggedIn: boolean;
  loggedInEmail?: string;
}) {
  const [isPending, startTransition] = useTransition();
  const emailMatches =
    isLoggedIn &&
    loggedInEmail?.toLowerCase() === email.toLowerCase();

  const acceptInvite = () => {
    startTransition(async () => {
      try {
        await acceptInvitationAction(token);
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
          error instanceof Error ? error.message : 'Unable to accept invitation.'
        );
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Join {tenantName}</CardTitle>
        <CardDescription>
          You have been invited as {role.replaceAll('_', ' ').toLowerCase()}{' '}
          for {email}.
        </CardDescription>
      </CardHeader>
      <CardContent className='flex flex-col gap-4'>
        {isLoggedIn ? (
          emailMatches ? (
            <Button
              onClick={acceptInvite}
              disabled={isPending}
            >
              {isPending ? 'Joining...' : 'Accept invitation'}
            </Button>
          ) : (
            <p className='text-sm text-muted-foreground'>
              Sign in as {email} to accept this invitation, or sign out and use
              the correct account.
            </p>
          )
        ) : (
          <div className='flex flex-wrap gap-3'>
            <Button
              asChild
            >
              <Link href={`/sign-in?callbackUrl=${encodeURIComponent(`/invite/${token}`)}`}>
                Sign in to accept
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function InviteSignUpForm({
  token,
  email,
}: {
  token: string;
  email: string;
}) {
  const [isPending, startTransition] = useTransition();

  const form = useForm<InviteSignUpInput>({
    resolver: zodResolver(inviteSignUpSchema),
    defaultValues: {
      name: '',
      email,
      password: '',
    },
  });

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      try {
        await inviteSignUpAction(token, values);
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
          error instanceof Error ? error.message : 'Unable to create account.'
        );
      }
    });
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create your account</CardTitle>
        <CardDescription>
          Set a password to join the organization.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={onSubmit}
          className='flex flex-col gap-4'
        >
          <FieldGroup>
            <Field data-invalid={!!form.formState.errors.name}>
              <FieldLabel htmlFor='name'>Full name</FieldLabel>
              <Input
                id='name'
                autoComplete='name'
                {...form.register('name')}
              />
              <FieldError errors={[form.formState.errors.name]} />
            </Field>
            <Field>
              <FieldLabel htmlFor='email'>Email</FieldLabel>
              <Input
                id='email'
                type='email'
                value={email}
                disabled
              />
              <input
                type='hidden'
                {...form.register('email')}
              />
            </Field>
            <Field data-invalid={!!form.formState.errors.password}>
              <FieldLabel htmlFor='password'>Password</FieldLabel>
              <Input
                id='password'
                type='password'
                autoComplete='new-password'
                {...form.register('password')}
              />
              <FieldError errors={[form.formState.errors.password]} />
            </Field>
            <Button
              type='submit'
              disabled={isPending}
            >
              {isPending ? 'Creating account...' : 'Create account and join'}
            </Button>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}
