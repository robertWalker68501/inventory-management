import type { ActivityLogFilters } from '@/lib/activity-log';

export function parseActivityLogFilters(params: {
  q?: string;
  entityType?: string;
}): ActivityLogFilters {
  return {
    q: params.q?.trim() || undefined,
    entityType: params.entityType?.trim() || 'ALL',
  };
}
