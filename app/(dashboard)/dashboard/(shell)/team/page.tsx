import { DashboardPageHeader } from '@/components/dashboard/DashboardPageHeader';
import { InviteMemberForm } from '@/components/team/InviteMemberForm';
import { PendingInvitationsTable } from '@/components/team/PendingInvitationsTable';
import { TeamMemberTable } from '@/components/team/TeamMemberTable';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  canManageTeam,
  getAssignableRoles,
} from '@/lib/permissions';
import {
  listPendingInvitations,
  listTeamMembers,
} from '@/lib/team';
import { requireTenantContext } from '@/lib/tenant-context';

export default async function TeamPage() {
  const { tenant, session, role } = await requireTenantContext();
  const canManage = canManageTeam(role);
  const assignableRoles = getAssignableRoles(role);

  const [members, invitations] = await Promise.all([
    listTeamMembers(tenant.id),
    canManage ? listPendingInvitations(tenant.id) : Promise.resolve([]),
  ]);

  return (
    <div className='flex flex-col gap-6'>
      <DashboardPageHeader
        title='Team members'
        description='Invite users and manage roles across your organization.'
      />

      {canManage ? (
        <>
          <InviteMemberForm assignableRoles={assignableRoles} />

          {invitations.length > 0 ? (
            <div className='space-y-3'>
              <div>
                <h2 className='font-heading text-lg font-medium'>
                  Pending invitations
                </h2>
                <p className='text-sm text-muted-foreground'>
                  Copy the invite link and share it with new users before it
                  expires.
                </p>
              </div>
              <PendingInvitationsTable invitations={invitations} />
            </div>
          ) : null}
        </>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>View only</CardTitle>
            <CardDescription>
              Contact an admin to invite members or change roles.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      <div className='space-y-3'>
        <div>
          <h2 className='font-heading text-lg font-medium'>Members</h2>
          <p className='text-sm text-muted-foreground'>
            {members.length} member{members.length === 1 ? '' : 's'} in{' '}
            {tenant.name}.
          </p>
        </div>
        <TeamMemberTable
          members={members}
          currentUserId={session.user.id}
          currentRole={role}
          assignableRoles={assignableRoles}
        />
      </div>
    </div>
  );
}
