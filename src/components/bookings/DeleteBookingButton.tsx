'use client';
import { useState } from 'react';
import { deleteBooking } from '@/app/actions/bookings';

export function DeleteBookingButton({ id }: { id: string }) {
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);

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
    <span className="inline-flex gap-2">
      <button
        onClick={async () => {
          setLoading(true);
          await deleteBooking(id);
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
    </span>
  );
}
