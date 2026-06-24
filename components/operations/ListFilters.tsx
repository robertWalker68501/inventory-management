'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTransition } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type ListFiltersProps = {
  query: string;
  status?: string;
  statusOptions?: readonly string[];
  activeOnly?: boolean;
  searchPlaceholder?: string;
};

export function ListFilters({
  query,
  status,
  statusOptions,
  activeOnly,
  searchPlaceholder = 'Search...',
}: ListFiltersProps) {
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

  const hasFilters =
    Boolean(query) ||
    (status && status !== 'ALL') ||
    Boolean(activeOnly);

  return (
    <div className='flex flex-col gap-3 lg:flex-row lg:items-end'>
      <div className='flex flex-1 flex-col gap-2'>
        <label
          htmlFor='list-search'
          className='text-sm font-medium'
        >
          Search
        </label>
        <Input
          id='list-search'
          placeholder={searchPlaceholder}
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
      {statusOptions ? (
        <div className='flex flex-col gap-2'>
          <span className='text-sm font-medium'>Status</span>
          <Select
            value={status ?? 'ALL'}
            onValueChange={(value) =>
              applyFilters({ status: value === 'ALL' ? null : value })
            }
            disabled={isPending}
          >
            <SelectTrigger className='w-full min-w-[160px]'>
              <SelectValue placeholder='All statuses' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='ALL'>All statuses</SelectItem>
              {statusOptions.map((option) => (
                <SelectItem
                  key={option}
                  value={option}
                >
                  {option.replaceAll('_', ' ')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : null}
      {activeOnly !== undefined ? (
        <div className='flex gap-2'>
          <Button
            type='button'
            variant={activeOnly ? 'default' : 'outline'}
            disabled={isPending}
            onClick={() => applyFilters({ active: activeOnly ? null : 'true' })}
          >
            Active only
          </Button>
        </div>
      ) : null}
      {hasFilters ? (
        <Button
          type='button'
          variant='ghost'
          disabled={isPending}
          onClick={() => router.push(pathname)}
        >
          Clear
        </Button>
      ) : null}
    </div>
  );
}
