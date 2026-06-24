import Link from 'next/link';

import { ModeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';

export default function MarketingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className='flex min-h-full flex-col'>
      <header className='border-b'>
        <div className='mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4'>
          <Link
            href='/'
            className='font-heading text-lg font-semibold'
          >
            Inventory
          </Link>
          <div className='flex items-center gap-2'>
            <ModeToggle />
            <Button
              variant='ghost'
              asChild
            >
              <Link href='/sign-in'>Sign in</Link>
            </Button>
            <Button asChild>
              <Link href='/sign-up'>Get started</Link>
            </Button>
          </div>
        </div>
      </header>
      <main className='flex flex-1 flex-col'>{children}</main>
    </div>
  );
}
