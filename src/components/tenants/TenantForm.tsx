'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Tenant } from '@/types';
import type { TenantFormData, ActionResult } from '@/app/actions/tenants';

type Props = { tenant?: Tenant; action: (data: TenantFormData) => Promise<ActionResult> };

export function TenantForm({ tenant, action }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const result = await action({
      name: fd.get('name') as string,
      egn: fd.get('egn') as string,
      phone: fd.get('phone') as string,
      email: fd.get('email') as string,
      whatsapp: fd.get('whatsapp') as string,
      notes: fd.get('notes') as string,
    });
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  const field = (
    name: keyof TenantFormData,
    label: string,
    type = 'text',
    defaultValue?: string,
  ) => (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">{label}</label>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue ?? ''}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
      />
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="max-w-lg space-y-4">
      {error && (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>
      )}
      {field('name', 'Name *', 'text', tenant?.name)}
      {field('egn', 'EGN (National ID)', 'text', tenant?.egn ?? '')}
      <div className="grid grid-cols-2 gap-4">
        {field('phone', 'Phone', 'tel', tenant?.phone ?? '')}
        {field('email', 'Email', 'email', tenant?.email ?? '')}
      </div>
      {field('whatsapp', 'WhatsApp Number', 'text', tenant?.whatsapp ?? '')}
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Notes</label>
        <textarea
          name="notes"
          defaultValue={tenant?.notes ?? ''}
          rows={3}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
      </div>
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Saving…' : 'Save'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
