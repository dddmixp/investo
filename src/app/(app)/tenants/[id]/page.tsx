import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createServerClient } from '@/lib/supabase/server';
import type { Tenant } from '@/types';

export default async function TenantDetailPage({
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
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">{tenant.name}</h1>
        <Link
          href={`/tenants/${id}/edit`}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Edit
        </Link>
      </div>
      <dl className="grid max-w-lg grid-cols-2 gap-4 text-sm">
        {(
          [
            ['Phone', tenant.phone],
            ['Email', tenant.email],
            ['WhatsApp', tenant.whatsapp],
            ['EGN', tenant.egn],
            ['Notes', tenant.notes],
          ] as [string, string | null][]
        ).map(([label, val]) => (
          <div key={label}>
            <dt className="font-medium text-gray-600">{label}</dt>
            <dd className="text-gray-900">{val ?? '—'}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
