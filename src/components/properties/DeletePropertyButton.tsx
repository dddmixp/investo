'use client';
import { useState } from 'react';
import { deleteProperty } from '@/app/actions/properties';

export function DeletePropertyButton({ id }: { id: string }) {
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!confirming) {
    return (
      <button onClick={() => setConfirming(true)}
        className="text-sm text-red-600 hover:text-red-800">
        Delete
      </button>
    );
  }

  return (
    <span className="inline-flex flex-col gap-1">
      {error && <span className="text-xs text-red-600">{error}</span>}
      <span className="inline-flex gap-2">
        <button
          onClick={async () => {
            setLoading(true);
            setError(null);
            const result = await deleteProperty(id);
            if (result?.error) {
              setError(result.error);
              setConfirming(false);
            }
            setLoading(false);
          }}
          disabled={loading}
          className="text-sm text-red-600 font-medium hover:text-red-800 disabled:opacity-50">
          {loading ? '…' : 'Confirm'}
        </button>
        <button onClick={() => setConfirming(false)} className="text-sm text-gray-500">Cancel</button>
      </span>
    </span>
  );
}
