'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTransition } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type WarehouseFiltersProps = {
  query: string;
  activeOnly: boolean;
};

export function WarehouseFilters({
  query,
  activeOnly,
}: WarehouseFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const applyFilters = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());

    Object.entries(updates).forEach(([key, value]) => {
      if (!value) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });

    const queryString = params.toString();

    startTransition(() => {
      router.push(queryString ? `${pathname}?${queryString}` : pathname);
    });
  };

  return (
    <div className='flex flex-col gap-3 lg:flex-row lg:items-end'>
      <div className='flex flex-1 flex-col gap-2'>
        <label
          htmlFor='warehouse-search'
          className='text-sm font-medium'
        >
          Search
        </label>
        <Input
          id='warehouse-search'
          placeholder='Search name, code, city, or state'
          defaultValue={query}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              applyFilters({ q: event.currentTarget.value || null });
            }
          }}
          onBlur={(event) => {
            const value = event.currentTarget.value.trim();
            if (value !== query) {
              applyFilters({ q: value || null });
            }
          }}
        />
      </div>
      <div className='flex gap-2'>
        <Button
          type='button'
          variant={activeOnly ? 'default' : 'outline'}
          disabled={isPending}
          onClick={() => applyFilters({ active: activeOnly ? null : 'true' })}
        >
          Active only
        </Button>
        {(query || activeOnly) && (
          <Button
            type='button'
            variant='ghost'
            disabled={isPending}
            onClick={() => router.push(pathname)}
          >
            Clear
          </Button>
        )}
      </div>
    </div>
  );
}
