'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { toast } from 'sonner';

import {
  cancelOrderAction,
  confirmOrderAction,
  deleteOrderAction,
} from '@/lib/actions/orders';
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

export function OrderActions({
  orderId,
  status,
}: {
  orderId: string;
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

  return (
    <div className='flex flex-wrap gap-2'>
      {status === 'DRAFT' ? (
        <>
          <Button
            disabled={isPending}
            onClick={() => runAction(() => confirmOrderAction(orderId))}
          >
            Confirm order
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant='destructive'
                disabled={isPending}
              >
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete order?</AlertDialogTitle>
                <AlertDialogDescription>
                  This draft order will be permanently removed.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => runAction(() => deleteOrderAction(orderId))}
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      ) : null}
      {['DRAFT', 'CONFIRMED'].includes(status) ? (
        <Button
          variant='outline'
          disabled={isPending}
          onClick={() => runAction(() => cancelOrderAction(orderId))}
        >
          Cancel order
        </Button>
      ) : null}
      {['CONFIRMED', 'PICKING', 'PACKED'].includes(status) ? (
        <Button
          variant='outline'
          asChild
        >
          <Link href={`/dashboard/shipments/new?orderId=${orderId}`}>
            Create shipment
          </Link>
        </Button>
      ) : null}
    </div>
  );
}
