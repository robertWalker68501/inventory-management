import Link from 'next/link';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function HomePage() {
  return (
    <div className='mx-auto flex w-full max-w-6xl flex-1 flex-col gap-12 px-6 py-16'>
      <section className='flex max-w-3xl flex-col gap-6'>
        <p className='text-sm font-medium text-primary'>Warehouse inventory SaaS</p>
        <h1 className='font-heading text-4xl font-semibold tracking-tight sm:text-5xl'>
          Manage warehouses, stock, and fulfillment in one place.
        </h1>
        <p className='text-lg text-muted-foreground'>
          Multi-tenant inventory management for receiving, picking, shipping,
          and team access across every warehouse you operate.
        </p>
        <div className='flex flex-wrap gap-3'>
          <Button
            size='lg'
            asChild
          >
            <Link href='/sign-up'>Create account</Link>
          </Button>
          <Button
            size='lg'
            variant='outline'
            asChild
          >
            <Link href='/sign-in'>Sign in</Link>
          </Button>
        </div>
      </section>

      <section className='grid gap-4 md:grid-cols-3'>
        <Card>
          <CardHeader>
            <CardTitle>Multi-tenant</CardTitle>
            <CardDescription>
              Each company gets isolated warehouses, inventory, and activity
              history.
            </CardDescription>
          </CardHeader>
          <CardContent className='text-sm text-muted-foreground'>
            Role-based access for owners, admins, managers, staff, and viewers.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Operations</CardTitle>
            <CardDescription>
              Track receiving, purchase orders, picking, and shipments end to
              end.
            </CardDescription>
          </CardHeader>
          <CardContent className='text-sm text-muted-foreground'>
            Stock levels stay scoped to locations inside each warehouse.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Visibility</CardTitle>
            <CardDescription>
              Dashboard insights for low stock, open orders, and inbound
              receiving.
            </CardDescription>
          </CardHeader>
          <CardContent className='text-sm text-muted-foreground'>
            Built for teams that need reliable inventory data every day.
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
