'use client';

import { useState } from 'react';
import { deleteLoan } from '@/app/actions/loans';

type DeleteLoanButtonProps = {
  id: string;
};

export function DeleteLoanButton({ id }: DeleteLoanButtonProps) {
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    setPending(true);
    setError(null);
    const result = await deleteLoan(id);
    setPending(false);
    if (result?.error) {
      setError(result.error);
      setConfirming(false);
    }
  }

  if (confirming) {
    return (
      <span className="flex items-center gap-2">
        {error && <span className="text-xs text-red-600">{error}</span>}
        <button
          onClick={handleConfirm}
          disabled={pending}
          className="text-sm font-medium text-red-600 hover:underline disabled:opacity-60"
        >
          {pending ? 'Deleting…' : 'Confirm'}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="text-sm text-gray-500 hover:underline"
        >
          Cancel
        </button>
      </span>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="text-sm text-red-600 hover:underline"
    >
      Delete
    </button>
  );
}
