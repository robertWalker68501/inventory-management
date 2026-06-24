'use client';

import { Check, ChevronsUpDown } from 'lucide-react';

import { switchTenantAction } from '@/lib/actions/auth';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type TenantOption = {
  tenantId: string;
  name: string;
  role: string;
};

export function TenantSwitcher({
  tenants,
  activeTenantId,
  className,
}: {
  tenants: TenantOption[];
  activeTenantId: string;
  className?: string;
}) {
  const activeTenant = tenants.find(
    (tenant) => tenant.tenantId === activeTenantId
  );

  if (tenants.length <= 1) {
    if (!activeTenant) {
      return null;
    }

    return (
      <div className='flex items-center gap-2'>
        <span className='text-sm text-muted-foreground'>{activeTenant.name}</span>
        <Badge variant='secondary'>{activeTenant.role}</Badge>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant='outline'
          size='sm'
          className={cn('w-full justify-between gap-2', className)}
        >
          <span className='max-w-[180px] truncate'>
            {activeTenant?.name ?? 'Select organization'}
          </span>
          {activeTenant ? (
            <Badge variant='secondary'>{activeTenant.role}</Badge>
          ) : null}
          <ChevronsUpDown className='size-4 opacity-50' />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align='start'
        className='w-72 p-1'
      >
        {tenants.map((tenant) => (
          <form
            key={tenant.tenantId}
            action={switchTenantAction.bind(null, tenant.tenantId)}
          >
            <button
              type='submit'
              className='flex w-full items-center justify-between gap-3 rounded-sm px-2 py-2 text-left text-sm hover:bg-muted'
            >
              <div className='flex min-w-0 flex-col gap-0.5'>
                <span className='truncate font-medium'>{tenant.name}</span>
                <span className='text-xs text-muted-foreground'>{tenant.role}</span>
              </div>
              {tenant.tenantId === activeTenantId ? (
                <Check className='size-4 shrink-0 text-primary' />
              ) : null}
            </button>
          </form>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
