'use client';
import { useState } from 'react';
import { deleteTransaction } from '@/app/actions/transactions';

export function DeleteTransactionButton({ id }: { id: string }) {
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
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
    <span className="inline-flex gap-2">
      <button
        onClick={async () => {
          setLoading(true);
          await deleteTransaction(id);
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
    </span>
  );
}
