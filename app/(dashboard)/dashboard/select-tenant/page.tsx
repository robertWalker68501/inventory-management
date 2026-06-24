import { redirect } from 'next/navigation';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { switchTenantAction } from '@/lib/actions/auth';
import { requireSession } from '@/lib/session';
import { getUserMemberships, setActiveTenant } from '@/lib/tenant-context';

export default async function SelectTenantPage() {
  const session = await requireSession();
  const memberships = await getUserMemberships(session.user.id);

  if (memberships.length === 0) {
    redirect('/sign-up');
  }

  if (memberships.length === 1) {
    await setActiveTenant(memberships[0].tenantId);
    redirect('/dashboard');
  }

  const activeTenantId = session.session.activeTenantId as string | undefined;

  return (
    <div className='flex min-h-full flex-col items-center justify-center px-6 py-12'>
      <div className='mx-auto flex w-full max-w-2xl flex-col gap-6'>
      <div className='flex flex-col gap-2'>
        <h1 className='font-heading text-3xl font-semibold tracking-tight'>
          Choose an organization
        </h1>
        <p className='text-muted-foreground'>
          Your account belongs to multiple organizations. Select one to
          continue or switch your active workspace.
        </p>
      </div>

      <div className='grid gap-4'>
        {memberships.map((membership) => {
          const isActive = membership.tenantId === activeTenantId;

          return (
            <Card
              key={membership.id}
              className={isActive ? 'ring-2 ring-primary/30' : undefined}
            >
              <CardHeader>
                <div className='flex items-center gap-2'>
                  <CardTitle>{membership.tenant.name}</CardTitle>
                  {isActive ? <Badge>Current</Badge> : null}
                </div>
                <CardDescription>
                  Role: {membership.role} · Slug: {membership.tenant.slug}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form
                  action={switchTenantAction.bind(null, membership.tenantId)}
                >
                  <Button type='submit'>
                    {isActive ? 'Continue with this org' : 'Switch to this org'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          );
        })}
      </div>
      </div>
    </div>
  );
}
