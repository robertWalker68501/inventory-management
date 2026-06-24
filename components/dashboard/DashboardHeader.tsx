'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { ModeToggle } from '@/components/ThemeToggle';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { getDashboardNavItem } from '@/lib/dashboard-navigation';

export function DashboardHeader() {
  const pathname = usePathname();
  const currentItem = getDashboardNavItem(pathname);

  return (
    <header className='flex h-14 shrink-0 items-center gap-2 border-b px-4'>
      <SidebarTrigger className='-ml-1' />
      <Separator
        orientation='vertical'
        className='mr-2 data-[orientation=vertical]:h-4'
      />
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem className='hidden md:block'>
            <BreadcrumbLink asChild>
              <Link href='/dashboard'>Dashboard</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          {currentItem && currentItem.href !== '/dashboard' ? (
            <>
              <BreadcrumbSeparator className='hidden md:block' />
              <BreadcrumbItem>
                <BreadcrumbPage>{currentItem.title}</BreadcrumbPage>
              </BreadcrumbItem>
            </>
          ) : null}
        </BreadcrumbList>
      </Breadcrumb>
      <div className='ml-auto'>
        <ModeToggle />
      </div>
    </header>
  );
}
