'use client';

import Link from 'next/link';
import { Boxes } from 'lucide-react';

import { SignOutButton } from '@/components/auth/SignOutButton';
import { TenantSwitcher } from '@/components/dashboard/TenantSwitcher';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
  useSidebar,
} from '@/components/ui/sidebar';
import { DashboardNav } from '@/components/dashboard/DashboardNav';

type TenantOption = {
  tenantId: string;
  name: string;
  role: string;
};

type AppSidebarProps = {
  tenants: TenantOption[];
  activeTenantId: string;
  user: {
    name: string;
    email: string;
  };
  hasTenant: boolean;
};

export function AppSidebar({
  tenants,
  activeTenantId,
  user,
  hasTenant,
}: AppSidebarProps) {
  const { isMobile, setOpenMobile } = useSidebar();

  const closeMobileSidebar = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  return (
    <Sidebar
      collapsible='icon'
      variant='inset'
    >
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size='lg'
              asChild
            >
              <Link
                href='/dashboard'
                onClick={closeMobileSidebar}
              >
                <div className='flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground'>
                  <Boxes className='size-4' />
                </div>
                <div className='grid flex-1 text-left text-sm leading-tight'>
                  <span className='truncate font-heading font-semibold'>
                    Inventory
                  </span>
                  <span className='truncate text-xs text-muted-foreground'>
                    Warehouse SaaS
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <div className='px-2 py-1 group-data-[collapsible=icon]:hidden'>
          {hasTenant ? (
            <TenantSwitcher
              tenants={tenants}
              activeTenantId={activeTenantId}
              className='w-full'
            />
          ) : (
            <Link
              href='/dashboard/select-tenant'
              className='text-sm text-primary underline-offset-4 hover:underline'
              onClick={closeMobileSidebar}
            >
              Select organization
            </Link>
          )}
        </div>
      </SidebarHeader>
      <SidebarContent>
        <DashboardNav />
      </SidebarContent>
      <SidebarFooter>
        <SidebarSeparator className='group-data-[collapsible=icon]:hidden' />
        <div className='flex flex-col gap-3 px-2 py-2 group-data-[collapsible=icon]:items-center'>
          <div className='min-w-0 group-data-[collapsible=icon]:hidden'>
            <p className='truncate text-sm font-medium'>{user.name}</p>
            <p className='truncate text-xs text-muted-foreground'>
              {user.email}
            </p>
          </div>
          <SignOutButton />
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
