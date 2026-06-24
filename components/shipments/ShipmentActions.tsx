'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { toast } from 'sonner';

import {
  cancelShipmentAction,
  deliverShipmentAction,
  shipShipmentAction,
} from '@/lib/actions/shipments';
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

export function ShipmentActions({
  shipmentId,
  status,
}: {
  shipmentId: string;
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
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button disabled={isPending}>Ship now</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Ship this shipment?</AlertDialogTitle>
                <AlertDialogDescription>
                  Inventory will be deducted from the warehouse and stock
                  movements will be recorded.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() =>
                    runAction(() => shipShipmentAction(shipmentId))
                  }
                >
                  Ship
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Button
            variant='outline'
            disabled={isPending}
            onClick={() => runAction(() => cancelShipmentAction(shipmentId))}
          >
            Cancel shipment
          </Button>
        </>
      ) : null}
      {status === 'IN_TRANSIT' ? (
        <Button
          disabled={isPending}
          onClick={() => runAction(() => deliverShipmentAction(shipmentId))}
        >
          Mark delivered
        </Button>
      ) : null}
    </div>
  );
}
