'use client';

import { useEffect } from 'react';
import { AlertCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

type DashboardErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export function DashboardError({ error, reset }: DashboardErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className='flex min-h-[50vh] items-center justify-center'>
      <Card className='w-full max-w-lg'>
        <CardHeader>
          <div className='mb-2 flex size-10 items-center justify-center rounded-lg bg-destructive/10 text-destructive'>
            <AlertCircle className='size-5' />
          </div>
          <CardTitle>Something went wrong</CardTitle>
          <CardDescription>
            We could not load this page. You can try again or return to the
            dashboard home.
          </CardDescription>
        </CardHeader>
        <CardContent className='flex flex-wrap gap-3'>
          <Button onClick={reset}>Try again</Button>
          <Button
            variant='outline'
            asChild
          >
            <a href='/dashboard'>Back to dashboard</a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
