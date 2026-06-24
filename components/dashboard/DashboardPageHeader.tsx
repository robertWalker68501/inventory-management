type DashboardPageHeaderProps = {
  title: string;
  description?: string;
};

export function DashboardPageHeader({
  title,
  description,
}: DashboardPageHeaderProps) {
  return (
    <div className='flex flex-col gap-1'>
      <h1 className='font-heading text-3xl font-semibold tracking-tight'>
        {title}
      </h1>
      {description ? (
        <p className='text-muted-foreground'>{description}</p>
      ) : null}
    </div>
  );
}
