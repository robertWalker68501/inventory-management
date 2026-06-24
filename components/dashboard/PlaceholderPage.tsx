import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { DashboardPageHeader } from '@/components/dashboard/DashboardPageHeader';

type PlaceholderPageProps = {
  title: string;
  description: string;
  phase: string;
};

export function PlaceholderPage({
  title,
  description,
  phase,
}: PlaceholderPageProps) {
  return (
    <div className='flex flex-col gap-6'>
      <DashboardPageHeader
        title={title}
        description={description}
      />
      <Card>
        <CardHeader>
          <CardTitle>Coming soon</CardTitle>
          <CardDescription>
            This section will be implemented in {phase}.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
