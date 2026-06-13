import { notFound } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';
import type { Tenant } from '@/types';
import { TenantForm } from '@/components/tenants/TenantForm';
import { updateTenant } from '@/app/actions/tenants';

export default async function EditTenantPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createServerClient();
  const { data } = await supabase.from('tenants').select('*').eq('id', id).single();
  if (!data) notFound();
  const tenant = data as Tenant;
  return (
    <div>
      <h1 className="mb-6 text-xl font-bold text-gray-900">Edit Tenant</h1>
      <TenantForm tenant={tenant} action={updateTenant.bind(null, id)} />
    </div>
  );
}
