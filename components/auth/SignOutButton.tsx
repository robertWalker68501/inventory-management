'use client';

import { Button } from '@/components/ui/button';
import { signOutAction } from '@/lib/actions/auth';

export function SignOutButton() {
  return (
    <form action={signOutAction}>
      <Button
        type='submit'
        variant='outline'
        size='sm'
      >
        Sign out
      </Button>
    </form>
  );
}
