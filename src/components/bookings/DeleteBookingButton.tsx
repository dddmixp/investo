'use client';
import { useState } from 'react';
import { deleteBooking } from '@/app/actions/bookings';

export function DeleteBookingButton({ id }: { id: string }) {
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!confirming) {
    return (
      <button
        onClick={() => setConfirming(true)}
        className="text-sm text-red-600 hover:text-red-800"
      >
        Delete
      </button>
    );
  }

  return (
    <span className="inline-flex items-center gap-2">
      <button
        onClick={async () => {
          setLoading(true);
          setError(null);
          try {
            const result = await deleteBooking(id);
            if (result?.error) {
              setError(result.error);
            }
          } catch {
            setError('Failed to delete booking');
          } finally {
            setLoading(false);
          }
        }}
        disabled={loading}
        className="text-sm font-medium text-red-600 hover:text-red-800 disabled:opacity-50"
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
