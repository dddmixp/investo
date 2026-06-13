'use client';
import { useState } from 'react';
import { deleteTenant } from '@/app/actions/tenants';

export function DeleteTenantButton({ id }: { id: string }) {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (error)
    return (
      <span className="inline-flex items-center gap-2">
        <span className="text-xs text-red-600">{error}</span>
        <button
          onClick={() => { setError(null); setConfirming(false); }}
          className="text-xs text-gray-500 underline"
        >
          Dismiss
        </button>
      </span>
    );
  if (!confirming)
    return (
      <button
        onClick={() => setConfirming(true)}
        className="text-sm text-red-600 hover:text-red-800"
      >
        Delete
      </button>
    );
  return (
    <span className="inline-flex items-center gap-2">
      <button
        onClick={async () => {
          setLoading(true);
          const r = await deleteTenant(id);
          if (r?.error) {
            setError(r.error);
            setLoading(false);
          }
        }}
        disabled={loading}
        className="text-sm font-medium text-red-600 disabled:opacity-50"
      >
        {loading ? '…' : 'Confirm'}
      </button>
      <button onClick={() => setConfirming(false)} className="text-sm text-gray-500">
        Cancel
      </button>
    </span>
  );
}
