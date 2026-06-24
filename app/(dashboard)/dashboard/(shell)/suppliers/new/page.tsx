import { SupplierForm } from '@/components/suppliers/SupplierForm';
import { DashboardPageHeader } from '@/components/dashboard/DashboardPageHeader';
import { canManageOperations } from '@/lib/permissions';
import { requireTenantContext } from '@/lib/tenant-context';
import { redirect } from 'next/navigation';

export default async function NewSupplierPage() {
  const { role } = await requireTenantContext();

  if (!canManageOperations(role)) {
    redirect('/dashboard/suppliers');
  }

  return (
    <div className='mx-auto flex w-full max-w-3xl flex-col gap-6'>
      <DashboardPageHeader
        title='New supplier'
        description='Add a vendor for purchase orders.'
      />
      <SupplierForm />
    </div>
  );
}
