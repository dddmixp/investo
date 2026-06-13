'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Property } from '@/types';
import type { PropertyFormData, ActionResult } from '@/app/actions/properties';

type Props = {
  property?: Property;
  action: (data: PropertyFormData) => Promise<ActionResult>;
};

export function PropertyForm({ property, action }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const result = await action({
      address: fd.get('address') as string,
      type: fd.get('type') as string,
      status: fd.get('status') as string,
      purchase_date: fd.get('purchase_date') as string,
      purchase_price: fd.get('purchase_price') as string,
      current_value: fd.get('current_value') as string,
    });
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
      {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</p>}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Address *</label>
        <input name="address" defaultValue={property?.address} required
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
          <select name="type" defaultValue={property?.type ?? ''} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
            <option value="">—</option>
            <option value="apartment">Apartment</option>
            <option value="house">House</option>
            <option value="commercial">Commercial</option>
            <option value="land">Land</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select name="status" defaultValue={property?.status ?? ''} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
            <option value="">—</option>
            <option value="owned">Owned</option>
            <option value="for_sale">For Sale</option>
            <option value="sold">Sold</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Date</label>
        <input name="purchase_date" type="date" defaultValue={property?.purchase_date ?? ''}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Price (€)</label>
          <input name="purchase_price" type="number" step="0.01" min="0"
            defaultValue={property?.purchase_price != null ? property.purchase_price / 100 : ''}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Current Value (€)</label>
          <input name="current_value" type="number" step="0.01" min="0"
            defaultValue={property?.current_value != null ? property.current_value / 100 : ''}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={loading}
          className="bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
          {loading ? 'Saving…' : 'Save'}
        </button>
        <button type="button" onClick={() => router.push('/properties')}
          className="border border-gray-300 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
          Cancel
        </button>
      </div>
    </form>
  );
}
