import { Skeleton } from '@/components/ui/skeleton';

export function DashboardPageSkeleton() {
  return (
    <div className='flex flex-col gap-8'>
      <div className='space-y-2'>
        <Skeleton className='h-8 w-64 max-w-full' />
        <Skeleton className='h-4 w-80 max-w-full' />
      </div>

      <section className='grid gap-4 sm:grid-cols-2 xl:grid-cols-3'>
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className='rounded-xl border p-6'
          >
            <Skeleton className='mb-3 h-4 w-28' />
            <Skeleton className='mb-4 h-9 w-20' />
            <Skeleton className='h-4 w-full' />
          </div>
        ))}
      </section>

      <div className='rounded-xl border p-6'>
        <Skeleton className='mb-4 h-6 w-40' />
        <div className='space-y-4'>
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className='space-y-2'
            >
              <Skeleton className='h-4 w-48' />
              <Skeleton className='h-3 w-full max-w-md' />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ListPageSkeleton() {
  return (
    <div className='flex flex-col gap-6'>
      <div className='flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between'>
        <div className='space-y-2'>
          <Skeleton className='h-8 w-48' />
          <Skeleton className='h-4 w-72 max-w-full' />
        </div>
        <Skeleton className='h-10 w-32' />
      </div>
      <div className='grid gap-3 lg:grid-cols-[1fr_180px_auto]'>
        <Skeleton className='h-10 w-full' />
        <Skeleton className='h-10 w-full' />
        <Skeleton className='h-10 w-20' />
      </div>
      <TablePageSkeleton />
    </div>
  );
}

export function TablePageSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className='overflow-x-auto rounded-xl border'>
      <div className='space-y-0'>
        <div className='grid grid-cols-4 gap-4 border-b p-4'>
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton
              key={index}
              className='h-4 w-full'
            />
          ))}
        </div>
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div
            key={rowIndex}
            className='grid grid-cols-4 gap-4 border-b p-4 last:border-b-0'
          >
            {Array.from({ length: 4 }).map((_, colIndex) => (
              <Skeleton
                key={colIndex}
                className='h-4 w-full'
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
