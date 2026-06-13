'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Tenancy, Property, Tenant } from '@/types';
import type { TenancyFormData, ActionResult } from '@/app/actions/tenancies';

type Props = {
  tenancy?: Tenancy;
  properties: Property[];
  tenants: Tenant[];
  action: (data: TenancyFormData) => Promise<ActionResult>;
  lockedTenantId?: string;
};

export function TenancyForm({ tenancy, properties, tenants, action, lockedTenantId }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const result = await action({
      property_id: fd.get('property_id') as string,
      tenant_id: lockedTenantId ?? (fd.get('tenant_id') as string),
      start_date: fd.get('start_date') as string,
      end_date: fd.get('end_date') as string,
      monthly_rent: fd.get('monthly_rent') as string,
      deposit: fd.get('deposit') as string,
      payment_day: fd.get('payment_day') as string,
      status: fd.get('status') as string,
    });
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
      {error && (
        <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</p>
      )}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Property *</label>
        <select
          name="property_id"
          defaultValue={tenancy?.property_id ?? ''}
          required
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
        >
          <option value="">Select property…</option>
          {properties.map((p) => (
            <option key={p.id} value={p.id}>
              {p.address}
            </option>
          ))}
        </select>
      </div>
      {!lockedTenantId && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tenant *</label>
          <select
            name="tenant_id"
            defaultValue={tenancy?.tenant_id ?? ''}
            required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="">Select tenant…</option>
            {tenants.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
      )}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
          <input
            name="start_date"
            type="date"
            defaultValue={tenancy?.start_date ?? ''}
            required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
          <input
            name="end_date"
            type="date"
            defaultValue={tenancy?.end_date ?? ''}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Monthly Rent (€) *
          </label>
          <input
            name="monthly_rent"
            type="number"
            step="0.01"
            min="0"
            defaultValue={tenancy ? tenancy.monthly_rent / 100 : ''}
            required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Deposit (€)</label>
          <input
            name="deposit"
            type="number"
            step="0.01"
            min="0"
            defaultValue={tenancy?.deposit != null ? tenancy.deposit / 100 : ''}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Payment Day</label>
          <input
            name="payment_day"
            type="number"
            min="1"
            max="31"
            defaultValue={tenancy?.payment_day ?? 1}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select
            name="status"
            defaultValue={tenancy?.status ?? 'active'}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="active">Active</option>
            <option value="expired">Expired</option>
            <option value="terminated">Terminated</option>
          </select>
        </div>
      </div>
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Saving…' : 'Save'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="border border-gray-300 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
