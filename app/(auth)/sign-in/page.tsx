import { Suspense } from 'react';

import { SignInForm } from '@/components/auth/SignInForm';

export default function SignInPage() {
  return (
    <Suspense fallback={<div className='text-sm text-muted-foreground'>Loading...</div>}>
      <SignInForm />
    </Suspense>
  );
}
