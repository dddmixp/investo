import Link from 'next/link';
import { createServerClient } from '@/lib/supabase/server';
import type { Tenant } from '@/types';
import { DeleteTenantButton } from '@/components/tenants/DeleteTenantButton';

export default async function TenantsPage() {
  const supabase = await createServerClient();
  const { data: tenants } = await supabase.from('tenants').select('*').order('name');
  const { data: activeCounts } = await supabase
    .from('tenancies')
    .select('tenant_id')
    .eq('status', 'active');
  const countMap = new Map<string, number>();
  (activeCounts ?? []).forEach(({ tenant_id }: { tenant_id: string }) =>
    countMap.set(tenant_id, (countMap.get(tenant_id) ?? 0) + 1),
  );

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Tenants</h1>
        <Link
          href="/tenants/new"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Add Tenant
        </Link>
      </div>
      {(tenants ?? []).length === 0 ? (
        <p className="text-sm text-gray-500">No tenants yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-left">
                <th className="px-4 py-3 font-medium text-gray-600">Name</th>
                <th className="px-4 py-3 font-medium text-gray-600">Phone</th>
                <th className="px-4 py-3 font-medium text-gray-600">Email</th>
                <th className="px-4 py-3 font-medium text-gray-600">Active Tenancies</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(tenants as Tenant[]).map((t) => (
                <tr key={t.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link
                      href={`/tenants/${t.id}`}
                      className="font-medium text-blue-600 hover:underline"
                    >
                      {t.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{t.phone ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{t.email ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{countMap.get(t.id) ?? 0}</td>
                  <td className="px-4 py-3">
                    <DeleteTenantButton id={t.id} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
