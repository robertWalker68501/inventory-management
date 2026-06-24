import type { Prisma } from '@/app/generated/prisma/client';
import prisma from '@/lib/prisma';

export type ActivityLogFilters = {
  q?: string;
  entityType?: string | 'ALL';
};

export type ActivityLogItem = {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  metadata: Prisma.JsonValue;
  createdAt: Date;
  user: {
    name: string;
    email: string;
  } | null;
};

export async function logActivity(input: {
  tenantId: string;
  userId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Prisma.InputJsonValue;
}) {
  await prisma.activityLog.create({
    data: {
      tenantId: input.tenantId,
      userId: input.userId ?? null,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId ?? null,
      metadata: input.metadata ?? undefined,
    },
  });
}

export async function listActivityLogs(
  tenantId: string,
  filters: ActivityLogFilters = {},
  limit = 50
) {
  const logs = await prisma.activityLog.findMany({
    where: {
      tenantId,
      ...(filters.entityType && filters.entityType !== 'ALL'
        ? { entityType: filters.entityType }
        : {}),
      ...(filters.q
        ? {
            OR: [
              { action: { contains: filters.q, mode: 'insensitive' } },
              { entityType: { contains: filters.q, mode: 'insensitive' } },
              { user: { name: { contains: filters.q, mode: 'insensitive' } } },
              { user: { email: { contains: filters.q, mode: 'insensitive' } } },
            ],
          }
        : {}),
    },
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });

  return logs satisfies ActivityLogItem[];
}

export async function getRecentActivityLogs(tenantId: string, limit = 8) {
  return listActivityLogs(tenantId, {}, limit);
}

export async function getActivityEntityTypes(tenantId: string) {
  const types = await prisma.activityLog.findMany({
    where: { tenantId },
    select: { entityType: true },
    distinct: ['entityType'],
    orderBy: { entityType: 'asc' },
  });

  return types.map((item) => item.entityType);
}

export function formatActivityAction(action: string) {
  return action
    .split('.')
    .map((part) =>
      part
        .split('_')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
    )
    .join(' · ');
}

export function getActivityMetadataSummary(
  metadata: Prisma.JsonValue | null
): string | null {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
    return null;
  }

  const record = metadata as Record<string, unknown>;
  const parts: string[] = [];

  if (typeof record.number === 'string') {
    parts.push(record.number);
  }

  if (typeof record.name === 'string') {
    parts.push(record.name);
  }

  if (typeof record.status === 'string') {
    parts.push(record.status);
  }

  if (typeof record.email === 'string') {
    parts.push(record.email);
  }

  return parts.length > 0 ? parts.join(' · ') : null;
}
