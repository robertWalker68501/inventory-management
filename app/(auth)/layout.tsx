import Link from 'next/link';

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className='flex min-h-full flex-col items-center justify-center px-6 py-12'>
      <div className='mb-8 text-center'>
        <Link
          href='/'
          className='font-heading text-xl font-semibold'
        >
          Inventory
        </Link>
        <p className='mt-2 text-sm text-muted-foreground'>
          Warehouse inventory management
        </p>
      </div>
      <div className='w-full max-w-md'>{children}</div>
    </div>
  );
}
