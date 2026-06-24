import { DashboardShell } from '@/components/dashboard/DashboardShell';
import { requireSession } from '@/lib/session';
import { getTenantContext } from '@/lib/tenant-context';

export default async function DashboardShellLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await requireSession();
  const context = await getTenantContext();

  const tenants =
    context?.memberships.map((membership) => ({
      tenantId: membership.tenantId,
      name: membership.tenant.name,
      role: membership.role,
    })) ?? [];

  const activeTenantId =
    (context?.session.session.activeTenantId as string | undefined) ?? '';

  return (
    <DashboardShell
      tenants={tenants}
      activeTenantId={activeTenantId}
      hasTenant={Boolean(context)}
      user={{
        name: session.user.name,
        email: session.user.email,
      }}
    >
      {children}
    </DashboardShell>
  );
}
