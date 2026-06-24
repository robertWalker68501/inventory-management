import { Badge } from '@/components/ui/badge';

const STATUS_VARIANTS: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  DRAFT: 'secondary',
  SUBMITTED: 'default',
  PARTIALLY_RECEIVED: 'outline',
  RECEIVED: 'default',
  COMPLETED: 'default',
  CONFIRMED: 'default',
  PICKING: 'outline',
  PACKED: 'outline',
  SHIPPED: 'default',
  IN_TRANSIT: 'outline',
  DELIVERED: 'default',
  CANCELLED: 'destructive',
  ACTIVE: 'default',
  INACTIVE: 'secondary',
};

export function StatusBadge({ status }: { status: string }) {
  const label = status.replaceAll('_', ' ');
  return (
    <Badge variant={STATUS_VARIANTS[status] ?? 'secondary'}>{label}</Badge>
  );
}
