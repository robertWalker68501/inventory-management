'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { toast } from 'sonner';

import { cancelInvitationAction } from '@/lib/actions/team';
import { StatusBadge } from '@/components/operations/StatusBadge';
import { InviteLinkCell } from '@/components/team/InviteLinkCell';
import { ResponsiveTableShell } from '@/components/ui/responsive-table-shell';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { PendingInvitation } from '@/lib/team';

export function PendingInvitationsTable({
  invitations,
}: {
  invitations: PendingInvitation[];
}) {
  if (invitations.length === 0) {
    return null;
  }

  return (
    <ResponsiveTableShell>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Expires</TableHead>
            <TableHead>Invite link</TableHead>
            <TableHead className='text-right'>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invitations.map((invitation) => (
            <InvitationRow
              key={invitation.id}
              invitation={invitation}
            />
          ))}
        </TableBody>
      </Table>
    </ResponsiveTableShell>
  );
}

function InvitationRow({ invitation }: { invitation: PendingInvitation }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const cancelInvite = () => {
    startTransition(async () => {
      try {
        await cancelInvitationAction(invitation.id);
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
          error instanceof Error ? error.message : 'Unable to cancel invitation.'
        );
        router.refresh();
      }
    });
  };

  return (
    <TableRow>
      <TableCell className='font-medium'>{invitation.email}</TableCell>
      <TableCell>
        <StatusBadge status={invitation.role} />
      </TableCell>
      <TableCell className='text-muted-foreground'>
        {new Date(invitation.expiresAt).toLocaleDateString()}
      </TableCell>
      <TableCell>
        <InviteLinkCell token={invitation.token} />
      </TableCell>
      <TableCell className='text-right'>
        <Button
          variant='ghost'
          size='sm'
          disabled={isPending}
          onClick={cancelInvite}
        >
          Cancel
        </Button>
      </TableCell>
    </TableRow>
  );
}
