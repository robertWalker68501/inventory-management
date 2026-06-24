import Link from 'next/link';

import {
  formatActivityAction,
  getActivityMetadataSummary,
  type ActivityLogItem,
} from '@/lib/activity-log';
import { ResponsiveTableShell } from '@/components/ui/responsive-table-shell';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export function ActivityLogTable({ logs }: { logs: ActivityLogItem[] }) {
  if (logs.length === 0) {
    return (
      <div className='rounded-xl border border-dashed px-6 py-16 text-center text-sm text-muted-foreground'>
        No activity matches your filters.
      </div>
    );
  }

  return (
    <ResponsiveTableShell>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>When</TableHead>
            <TableHead>Action</TableHead>
            <TableHead>Entity</TableHead>
            <TableHead>User</TableHead>
            <TableHead>Details</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.map((log) => {
            const summary = getActivityMetadataSummary(log.metadata);

            return (
              <TableRow key={log.id}>
                <TableCell className='whitespace-nowrap text-muted-foreground'>
                  {new Date(log.createdAt).toLocaleString()}
                </TableCell>
                <TableCell className='font-medium'>
                  {formatActivityAction(log.action)}
                </TableCell>
                <TableCell>{log.entityType}</TableCell>
                <TableCell className='text-muted-foreground'>
                  {log.user?.name ?? 'System'}
                </TableCell>
                <TableCell className='max-w-[240px] truncate text-muted-foreground'>
                  {summary ?? '—'}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </ResponsiveTableShell>
  );
}

export function RecentActivityFeed({
  logs,
}: {
  logs: ActivityLogItem[];
}) {
  if (logs.length === 0) {
    return (
      <p className='text-sm text-muted-foreground'>
        No recent activity yet. Actions across inventory and operations will
        appear here.
      </p>
    );
  }

  return (
    <ul className='space-y-4'>
      {logs.map((log) => {
        const summary = getActivityMetadataSummary(log.metadata);

        return (
          <li
            key={log.id}
            className='flex flex-col gap-1 border-b pb-4 last:border-b-0 last:pb-0 sm:flex-row sm:items-start sm:justify-between'
          >
            <div className='min-w-0 space-y-1'>
              <p className='font-medium'>
                {formatActivityAction(log.action)}
              </p>
              <p className='text-sm text-muted-foreground'>
                {log.user?.name ?? 'System'} · {log.entityType}
                {summary ? ` · ${summary}` : ''}
              </p>
            </div>
            <time className='shrink-0 text-sm text-muted-foreground'>
              {new Date(log.createdAt).toLocaleString()}
            </time>
          </li>
        );
      })}
    </ul>
  );
}

export function RecentActivityCardFooter() {
  return (
    <Button
      variant='outline'
      asChild
      className='w-fit'
    >
      <Link href='/dashboard/reports'>View all activity</Link>
    </Button>
  );
}
