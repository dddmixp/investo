'use client';
import { useState } from 'react';
import { deleteTransaction } from '@/app/actions/transactions';

export function DeleteTransactionButton({ id }: { id: string }) {
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
          setError(null);
          const result = await deleteTransaction(id);
          if (result?.error) {
            setError(result.error);
          }
          setLoading(false);
        }}
        disabled={loading}
        className="text-sm text-red-600 font-medium disabled:opacity-50"
      >
        {loading ? '…' : 'Confirm'}
      </button>
      <button
        onClick={() => setConfirming(false)}
        className="text-sm text-gray-500"
      >
        Cancel
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </span>
  );
}
