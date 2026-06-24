import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  RecentActivityCardFooter,
  RecentActivityFeed,
} from '@/components/activity/ActivityLogTable';
import { DashboardPageHeader } from '@/components/dashboard/DashboardPageHeader';
import { getRecentActivityLogs } from '@/lib/activity-log';
import { getDashboardStats } from '@/lib/dashboard-stats';
import { requireTenantContext } from '@/lib/tenant-context';

export default async function DashboardPage() {
  const { tenant, role, session } = await requireTenantContext();
  const [stats, recentActivity] = await Promise.all([
    getDashboardStats(tenant.id),
    getRecentActivityLogs(tenant.id),
  ]);

  const statCards = [
    {
      title: 'Active warehouses',
      value: stats.activeWarehouses.toString(),
      description: 'Operational warehouse locations',
    },
    {
      title: 'Inventory items',
      value: stats.inventoryItems.toString(),
      description: 'Active SKUs in catalog',
    },
    {
      title: 'Units on hand',
      value: stats.totalOnHand.toLocaleString(),
      description: 'Total quantity across all locations',
    },
    {
      title: 'Low stock items',
      value: stats.lowStockCount.toString(),
      description: 'At or below reorder point',
    },
    {
      title: 'Pending receiving',
      value: stats.pendingReceiving.toString(),
      description: 'Draft or in-progress receipts',
    },
    {
      title: 'Open orders',
      value: stats.openOrders.toString(),
      description: 'Orders not yet shipped',
    },
    {
      title: 'Shipments today',
      value: stats.shipmentsToday.toString(),
      description: 'Shipments recorded today',
    },
  ];

  return (
    <div className='flex flex-col gap-8'>
      <DashboardPageHeader
        title={`Welcome back, ${session.user.name}`}
        description={`${tenant.name} · ${role}`}
      />

      <section className='grid gap-4 sm:grid-cols-2 xl:grid-cols-3'>
        {statCards.map((card) => (
          <Card key={card.title}>
            <CardHeader>
              <CardDescription>{card.title}</CardDescription>
              <CardTitle className='text-3xl font-semibold tabular-nums'>
                {card.value}
              </CardTitle>
            </CardHeader>
            <CardContent className='text-sm text-muted-foreground'>
              {card.description}
            </CardContent>
          </Card>
        ))}
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Recent activity</CardTitle>
          <CardDescription>
            Latest changes across your organization.
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <RecentActivityFeed logs={recentActivity} />
          <RecentActivityCardFooter />
        </CardContent>
      </Card>
    </div>
  );
}
