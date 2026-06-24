'use client';

import { AppSidebar } from '@/components/dashboard/AppSidebar';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { TooltipProvider } from '@/components/ui/tooltip';

type TenantOption = {
  tenantId: string;
  name: string;
  role: string;
};

type DashboardShellProps = {
  children: React.ReactNode;
  tenants: TenantOption[];
  activeTenantId: string;
  user: {
    name: string;
    email: string;
  };
  hasTenant: boolean;
};

export function DashboardShell({
  children,
  tenants,
  activeTenantId,
  user,
  hasTenant,
}: DashboardShellProps) {
  return (
    <TooltipProvider delayDuration={0}>
      <SidebarProvider>
        <AppSidebar
          tenants={tenants}
          activeTenantId={activeTenantId}
          user={user}
          hasTenant={hasTenant}
        />
        <SidebarInset className='min-w-0'>
          <DashboardHeader />
          <div className='flex flex-1 flex-col gap-6 overflow-x-hidden p-4 md:p-6'>
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
