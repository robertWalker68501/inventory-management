'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { toast } from 'sonner';

import {
  cancelPurchaseOrderAction,
  deletePurchaseOrderAction,
  submitPurchaseOrderAction,
} from '@/lib/actions/purchase-orders';
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

export function PurchaseOrderActions({
  purchaseOrderId,
  status,
}: {
  purchaseOrderId: string;
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
            onClick={() =>
              runAction(() => submitPurchaseOrderAction(purchaseOrderId))
            }
          >
            Submit PO
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
                <AlertDialogTitle>Delete purchase order?</AlertDialogTitle>
                <AlertDialogDescription>
                  This draft purchase order will be permanently removed.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() =>
                    runAction(() => deletePurchaseOrderAction(purchaseOrderId))
                  }
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      ) : null}
      {['DRAFT', 'SUBMITTED'].includes(status) ? (
        <Button
          variant='outline'
          disabled={isPending}
          onClick={() =>
            runAction(() => cancelPurchaseOrderAction(purchaseOrderId))
          }
        >
          Cancel PO
        </Button>
      ) : null}
      {['SUBMITTED', 'PARTIALLY_RECEIVED'].includes(status) ? (
        <Button
          variant='outline'
          asChild
        >
          <Link href={`/dashboard/receiving/new?purchaseOrderId=${purchaseOrderId}`}>
            Receive goods
          </Link>
        </Button>
      ) : null}
    </div>
  );
}
