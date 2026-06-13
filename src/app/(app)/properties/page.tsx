import Link from 'next/link';
import { createServerClient } from '@/lib/supabase/server';
import type { Property } from '@/types';
import { formatEUR } from '@/lib/format';
import { DeletePropertyButton } from '@/components/properties/DeletePropertyButton';

const STATUS_BADGE: Record<string, string> = {
  owned: 'bg-green-100 text-green-700',
  for_sale: 'bg-yellow-100 text-yellow-700',
  sold: 'bg-gray-100 text-gray-600',
};

export default async function PropertiesPage() {
  const supabase = await createServerClient();
  const { data: properties } = await supabase
    .from('properties')
    .select('*')
    .order('created_at', { ascending: false });

  const rows = (properties ?? []) as Property[];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">Properties</h1>
        <Link href="/properties/new"
          className="bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-blue-700">
          Add Property
        </Link>
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-gray-500">No properties yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-left">
                <th className="px-4 py-3 font-medium text-gray-600">Address</th>
                <th className="px-4 py-3 font-medium text-gray-600">Type</th>
                <th className="px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="px-4 py-3 font-medium text-gray-600">Purchase Price</th>
                <th className="px-4 py-3 font-medium text-gray-600">Current Value</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map(p => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link href={`/properties/${p.id}/edit`} className="font-medium text-blue-600 hover:underline">
                      {p.address}
                    </Link>
                  </td>
                  <td className="px-4 py-3 capitalize text-gray-600">{p.type ?? '—'}</td>
                  <td className="px-4 py-3">
                    {p.status ? (
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[p.status] ?? ''}`}>
                        {p.status.replace('_', ' ')}
                      </span>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {p.purchase_price != null ? formatEUR(p.purchase_price) : '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {p.current_value != null ? formatEUR(p.current_value) : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <DeletePropertyButton id={p.id} />
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
