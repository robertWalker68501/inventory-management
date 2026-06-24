import { Suspense } from 'react';

import { ActivityLogFilters } from '@/components/activity/ActivityLogFilters';
import { ActivityLogTable } from '@/components/activity/ActivityLogTable';
import { DashboardPageHeader } from '@/components/dashboard/DashboardPageHeader';
import {
  getActivityEntityTypes,
  listActivityLogs,
} from '@/lib/activity-log';
import { requireTenantContext } from '@/lib/tenant-context';
import { parseActivityLogFilters } from '@/lib/validations/activity-log';

type ReportsPageProps = {
  searchParams: Promise<{
    q?: string;
    entityType?: string;
  }>;
};

export default async function ReportsPage({ searchParams }: ReportsPageProps) {
  const { tenant } = await requireTenantContext();
  const params = await searchParams;
  const filters = parseActivityLogFilters(params);

  const [logs, entityTypes] = await Promise.all([
    listActivityLogs(tenant.id, filters),
    getActivityEntityTypes(tenant.id),
  ]);

  return (
    <div className='flex flex-col gap-6'>
      <DashboardPageHeader
        title='Activity reports'
        description='Audit trail of inventory, operations, team, and settings changes.'
      />

      <Suspense fallback={<div className='text-sm text-muted-foreground'>Loading filters...</div>}>
        <ActivityLogFilters
          query={filters.q ?? ''}
          entityType={filters.entityType ?? 'ALL'}
          entityTypes={entityTypes}
        />
      </Suspense>

      <ActivityLogTable logs={logs} />
    </div>
  );
}
