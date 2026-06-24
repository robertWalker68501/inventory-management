'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { toast } from 'sonner';

import type { MembershipRole } from '@/app/generated/prisma/client';
import {
  removeMemberAction,
  updateMemberRoleAction,
} from '@/lib/actions/team';
import { StatusBadge } from '@/components/operations/StatusBadge';
import { ResponsiveTableShell } from '@/components/ui/responsive-table-shell';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { canManageMember } from '@/lib/permissions';
import type { TeamMember } from '@/lib/team';

export function TeamMemberTable({
  members,
  currentUserId,
  currentRole,
  assignableRoles,
}: {
  members: TeamMember[];
  currentUserId: string;
  currentRole: MembershipRole;
  assignableRoles: MembershipRole[];
}) {
  return (
    <ResponsiveTableShell>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Joined</TableHead>
            <TableHead className='w-[180px] text-right'>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {members.map((member) => (
            <TeamMemberRow
              key={member.id}
              member={member}
              currentUserId={currentUserId}
              currentRole={currentRole}
              assignableRoles={assignableRoles}
            />
          ))}
        </TableBody>
      </Table>
    </ResponsiveTableShell>
  );
}

function TeamMemberRow({
  member,
  currentUserId,
  currentRole,
  assignableRoles,
}: {
  member: TeamMember;
  currentUserId: string;
  currentRole: MembershipRole;
  assignableRoles: MembershipRole[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const canManage = canManageMember(
    currentRole,
    currentUserId,
    member.userId,
    member.role
  );
  const isOwner = member.role === 'OWNER';

  const updateRole = (role: MembershipRole) => {
    startTransition(async () => {
      try {
        await updateMemberRoleAction(member.id, { role });
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
          error instanceof Error ? error.message : 'Unable to update role.'
        );
        router.refresh();
      }
    });
  };

  const removeMember = () => {
    startTransition(async () => {
      try {
        await removeMemberAction(member.id);
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
          error instanceof Error ? error.message : 'Unable to remove member.'
        );
        router.refresh();
      }
    });
  };

  return (
    <TableRow>
      <TableCell className='font-medium'>
        {member.user.name}
        {member.userId === currentUserId ? (
          <span className='ml-2 text-xs text-muted-foreground'>(you)</span>
        ) : null}
      </TableCell>
      <TableCell className='text-muted-foreground'>{member.user.email}</TableCell>
      <TableCell>
        {canManage && !isOwner ? (
          <Select
            value={member.role}
            onValueChange={(value) => updateRole(value as MembershipRole)}
            disabled={isPending}
          >
            <SelectTrigger className='w-[140px]'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {assignableRoles.map((role) => (
                <SelectItem
                  key={role}
                  value={role}
                >
                  {role}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <StatusBadge status={member.role} />
        )}
      </TableCell>
      <TableCell className='text-muted-foreground'>
        {new Date(member.createdAt).toLocaleDateString()}
      </TableCell>
      <TableCell className='text-right'>
        {canManage ? (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant='ghost'
                size='sm'
                disabled={isPending}
              >
                Remove
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Remove team member?</AlertDialogTitle>
                <AlertDialogDescription>
                  {member.user.name} will lose access to this organization.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={removeMember}>
                  Remove
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        ) : (
          <span className='text-sm text-muted-foreground'>—</span>
        )}
      </TableCell>
    </TableRow>
  );
}
