import { DashboardPageHeader } from '@/components/dashboard/DashboardPageHeader';
import { ProfileSettingsForm } from '@/components/settings/ProfileSettingsForm';
import { TenantSettingsForm } from '@/components/settings/TenantSettingsForm';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  canManageTenantSettings,
  canManageTenantSlug,
} from '@/lib/permissions';
import { requireTenantContext } from '@/lib/tenant-context';

export default async function SettingsPage() {
  const { tenant, session, role } = await requireTenantContext();
  const canManageTenant = canManageTenantSettings(role);
  const canEditSlug = canManageTenantSlug(role);

  return (
    <div className='mx-auto flex w-full max-w-3xl flex-col gap-6'>
      <DashboardPageHeader
        title='Settings'
        description='Update organization preferences and your account profile.'
      />

      <ProfileSettingsForm
        defaultValues={{
          name: session.user.name,
          email: session.user.email,
        }}
      />

      {canManageTenant ? (
        <TenantSettingsForm
          canEditSlug={canEditSlug}
          defaultValues={{
            name: tenant.name,
            slug: tenant.slug,
          }}
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Organization</CardTitle>
            <CardDescription>
              {tenant.name} · {tenant.slug}
            </CardDescription>
          </CardHeader>
        </Card>
      )}
    </div>
  );
}
