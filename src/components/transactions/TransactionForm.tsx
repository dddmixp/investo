'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Property } from '@/types';
import type { TransactionFormData, ActionResult } from '@/app/actions/transactions';
import { getCategoriesForType } from '@/lib/transactions';

type Props = {
  properties: Property[];
  action: (data: TransactionFormData) => Promise<ActionResult>;
};

export function TransactionForm({ properties, action }: Props) {
  const router = useRouter();
  const [type, setType] = useState<'income' | 'expense'>('income');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const result = await action({
      property_id: fd.get('property_id') as string,
      type: fd.get('type') as string,
      category: fd.get('category') as string,
      amount: fd.get('amount') as string,
      date: fd.get('date') as string,
      description: fd.get('description') as string,
    });
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  const categories = getCategoriesForType(type);

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
      {error && (
        <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</p>
      )}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Property *
        </label>
        <select
          name="property_id"
          required
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
        >
          <option value="">Select…</option>
          {properties.map((p) => (
            <option key={p.id} value={p.id}>
              {p.address}
            </option>
          ))}
        </select>
      </div>
      <div className="flex gap-4">
        {(['income', 'expense'] as const).map((t) => (
          <label
            key={t}
            className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer"
          >
            <input
              type="radio"
              name="type"
              value={t}
              checked={type === t}
              onChange={() => setType(t)}
              className="accent-blue-600"
            />
            <span className="capitalize">{t}</span>
          </label>
        ))}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Category
        </label>
        <select
          name="category"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
        >
          <option value="">—</option>
          {categories.map((c) => (
            <option key={c} value={c} className="capitalize">
              {c}
            </option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Amount (€) *
          </label>
          <input
            name="amount"
            type="number"
            step="0.01"
            min="0"
            required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Date *
          </label>
          <input
            name="date"
            type="date"
            required
            defaultValue={new Date().toISOString().split('T')[0]}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <input
          name="description"
          type="text"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
        />
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
