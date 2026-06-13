import { notFound } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';
import type { Property } from '@/types';
import { TenancyForm } from '@/components/tenancies/TenancyForm';
import { createTenancy } from '@/app/actions/tenancies';

export default async function NewTenancyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createServerClient();
  const [{ data: tenant }, { data: properties }] = await Promise.all([
    supabase.from('tenants').select('id').eq('id', id).single(),
    supabase.from('properties').select('id, address').order('address'),
  ]);
  if (!tenant) notFound();
  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-6">Add Tenancy</h1>
      <TenancyForm
        properties={(properties ?? []) as Property[]}
        tenants={[]}
        action={createTenancy}
        lockedTenantId={id}
      />
    </div>
  );
}
