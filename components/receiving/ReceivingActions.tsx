'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { toast } from 'sonner';

import {
  cancelReceivingAction,
  completeReceivingAction,
} from '@/lib/actions/receiving';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';

export function ReceivingActions({
  receivingId,
  status,
}: {
  receivingId: string;
  status: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const runAction = (action: () => Promise<void>) => {
    startTransition(async () => {
      try {
        await action();
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

        toast.error(error instanceof Error ? error.message : 'Action failed.');
        router.refresh();
      }
    });
  };

  if (status !== 'DRAFT') {
    return null;
  }

  return (
    <div className='flex flex-wrap gap-2'>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button disabled={isPending}>Complete receiving</Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Complete receiving?</AlertDialogTitle>
            <AlertDialogDescription>
              This will add received quantities to inventory and update linked
              purchase orders. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                runAction(() => completeReceivingAction(receivingId))
              }
            >
              Complete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Button
        variant='outline'
        disabled={isPending}
        onClick={() => runAction(() => cancelReceivingAction(receivingId))}
      >
        Cancel receiving
      </Button>
    </div>
  );
}
