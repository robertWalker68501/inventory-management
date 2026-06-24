import type { LucideIcon } from 'lucide-react';
import {
  Boxes,
  Building2,
  ClipboardList,
  FileText,
  LayoutDashboard,
  Package,
  Settings,
  Ship,
  Truck,
  Users,
  Warehouse,
  BarChart3,
} from 'lucide-react';

export type DashboardNavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  description?: string;
};

export type DashboardNavGroup = {
  label: string;
  items: DashboardNavItem[];
};

export const dashboardNavGroups: DashboardNavGroup[] = [
  {
    label: 'Overview',
    items: [
      {
        title: 'Dashboard',
        href: '/dashboard',
        icon: LayoutDashboard,
        description: 'Summary metrics and activity',
      },
    ],
  },
  {
    label: 'Inventory',
    items: [
      {
        title: 'Inventory',
        href: '/dashboard/inventory',
        icon: Package,
        description: 'SKU catalog and item details',
      },
      {
        title: 'Stock levels',
        href: '/dashboard/stock',
        icon: Boxes,
        description: 'On-hand, reserved, and incoming stock',
      },
      {
        title: 'Warehouses',
        href: '/dashboard/warehouses',
        icon: Warehouse,
        description: 'Locations and bin tracking',
      },
    ],
  },
  {
    label: 'Operations',
    items: [
      {
        title: 'Receiving',
        href: '/dashboard/receiving',
        icon: Truck,
        description: 'Inbound shipments and putaway',
      },
      {
        title: 'Purchase orders',
        href: '/dashboard/purchase-orders',
        icon: FileText,
        description: 'Supplier POs and inbound planning',
      },
      {
        title: 'Orders',
        href: '/dashboard/orders',
        icon: ClipboardList,
        description: 'Outbound orders and picking',
      },
      {
        title: 'Shipments',
        href: '/dashboard/shipments',
        icon: Ship,
        description: 'Fulfillment and delivery tracking',
      },
    ],
  },
  {
    label: 'Organization',
    items: [
      {
        title: 'Suppliers',
        href: '/dashboard/suppliers',
        icon: Building2,
        description: 'Vendor records',
      },
      {
        title: 'Reports',
        href: '/dashboard/reports',
        icon: BarChart3,
        description: 'Activity audit trail and operational reports',
      },
      {
        title: 'Team',
        href: '/dashboard/team',
        icon: Users,
        description: 'Members, roles, and invitations',
      },
      {
        title: 'Settings',
        href: '/dashboard/settings',
        icon: Settings,
        description: 'Tenant and account settings',
      },
    ],
  },
];

export const dashboardNavItems = dashboardNavGroups.flatMap(
  (group) => group.items
);

export function getDashboardNavItem(pathname: string) {
  if (pathname === '/dashboard') {
    return dashboardNavItems.find((item) => item.href === '/dashboard');
  }

  return dashboardNavItems.find(
    (item) => item.href !== '/dashboard' && pathname.startsWith(item.href)
  );
}
