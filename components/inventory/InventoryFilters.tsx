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
import { inventoryItemStatuses } from '@/lib/validations/inventory';

type InventoryFiltersProps = {
  query: string;
  status: string;
  lowStock: boolean;
};

export function InventoryFilters({
  query,
  status,
  lowStock,
}: InventoryFiltersProps) {
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
          htmlFor='inventory-search'
          className='text-sm font-medium'
        >
          Search
        </label>
        <Input
          id='inventory-search'
          placeholder='Search SKU, name, category, or barcode'
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
        <span className='text-sm font-medium'>Status</span>
        <Select
          value={status}
          onValueChange={(value) => applyFilters({ status: value === 'ALL' ? null : value })}
          disabled={isPending}
        >
          <SelectTrigger className='w-full min-w-[160px]'>
            <SelectValue placeholder='All statuses' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='ALL'>All statuses</SelectItem>
            {inventoryItemStatuses.map((itemStatus) => (
              <SelectItem
                key={itemStatus}
                value={itemStatus}
              >
                {itemStatus}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className='flex gap-2'>
        <Button
          type='button'
          variant={lowStock ? 'default' : 'outline'}
          disabled={isPending}
          onClick={() =>
            applyFilters({ lowStock: lowStock ? null : 'true' })
          }
        >
          Low stock only
        </Button>
        {(query || status !== 'ALL' || lowStock) && (
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
