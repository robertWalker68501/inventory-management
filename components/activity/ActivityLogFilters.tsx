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

type ActivityLogFiltersProps = {
  query: string;
  entityType: string;
  entityTypes: string[];
};

export function ActivityLogFilters({
  query,
  entityType,
  entityTypes,
}: ActivityLogFiltersProps) {
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

  const hasFilters = Boolean(query) || (entityType && entityType !== 'ALL');

  return (
    <div className='flex flex-col gap-3 lg:flex-row lg:items-end'>
      <div className='flex flex-1 flex-col gap-2'>
        <label
          htmlFor='activity-search'
          className='text-sm font-medium'
        >
          Search
        </label>
        <Input
          id='activity-search'
          placeholder='Search action, entity, or user'
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
      <div className='flex flex-col gap-2'>
        <span className='text-sm font-medium'>Entity type</span>
        <Select
          value={entityType}
          onValueChange={(value) =>
            applyFilters({ entityType: value === 'ALL' ? null : value })
          }
          disabled={isPending}
        >
          <SelectTrigger className='w-full min-w-[180px]'>
            <SelectValue placeholder='All entities' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='ALL'>All entities</SelectItem>
            {entityTypes.map((type) => (
              <SelectItem
                key={type}
                value={type}
              >
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
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
