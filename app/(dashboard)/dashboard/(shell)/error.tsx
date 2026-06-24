'use client';

import { DashboardError } from '@/components/dashboard/DashboardError';

export default function DashboardShellError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <DashboardError
      error={error}
      reset={reset}
    />
  );
}
