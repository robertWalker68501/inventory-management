import Link from 'next/link';
import { notFound } from 'next/navigation';
import { headers } from 'next/headers';

import {
  InviteAcceptPanel,
  InviteSignUpForm,
} from '@/components/team/InviteAcceptPanel';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { auth } from '@/lib/auth';
import { getInvitationByToken } from '@/lib/team';

type InvitePageProps = {
  params: Promise<{ token: string }>;
};

export default async function InvitePage({ params }: InvitePageProps) {
  const { token } = await params;
  const invitation = await getInvitationByToken(token);

  if (!invitation) {
    notFound();
  }

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (invitation.status === 'ACCEPTED') {
    return (
      <InviteStatusCard
        title='Invitation already accepted'
        description='This invitation has already been used.'
        actionHref={session ? '/dashboard' : '/sign-in'}
        actionLabel={session ? 'Go to dashboard' : 'Sign in'}
      />
    );
  }

  if (invitation.status !== 'PENDING') {
    return (
      <InviteStatusCard
        title='Invitation unavailable'
        description='This invitation has expired or was cancelled.'
        actionHref='/sign-in'
        actionLabel='Sign in'
      />
    );
  }

  const existingUser = session?.user;
  const showSignUp = !existingUser;

  return (
    <div className='mx-auto flex w-full max-w-md flex-col gap-6'>
      <InviteAcceptPanel
        token={token}
        tenantName={invitation.tenant.name}
        role={invitation.role}
        email={invitation.email}
        isLoggedIn={Boolean(existingUser)}
        loggedInEmail={existingUser?.email}
      />

      {showSignUp ? (
        <>
          <div className='relative'>
            <div className='absolute inset-0 flex items-center'>
              <span className='w-full border-t' />
            </div>
            <div className='relative flex justify-center text-xs uppercase'>
              <span className='bg-background px-2 text-muted-foreground'>
                New to the app
              </span>
            </div>
          </div>
          <InviteSignUpForm
            token={token}
            email={invitation.email}
          />
          <p className='text-center text-sm text-muted-foreground'>
            Already have an account?{' '}
            <Link
              href={`/sign-in?callbackUrl=${encodeURIComponent(`/invite/${token}`)}`}
              className='font-medium text-foreground underline-offset-4 hover:underline'
            >
              Sign in
            </Link>
          </p>
        </>
      ) : null}
    </div>
  );
}

function InviteStatusCard({
  title,
  description,
  actionHref,
  actionLabel,
}: {
  title: string;
  description: string;
  actionHref: string;
  actionLabel: string;
}) {
  return (
    <div className='mx-auto w-full max-w-md'>
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <div className='px-6 pb-6'>
          <Button
            asChild
            className='w-full'
          >
            <Link href={actionHref}>{actionLabel}</Link>
          </Button>
        </div>
      </Card>
    </div>
  );
}
