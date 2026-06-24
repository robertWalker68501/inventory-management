import { cn } from '@/lib/utils';

export function ResponsiveTableShell({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('overflow-x-auto rounded-xl border', className)}>
      {children}
    </div>
  );
}
