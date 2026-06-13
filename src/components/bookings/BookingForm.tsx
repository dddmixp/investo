'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Booking, Property } from '@/types';
import type { BookingFormData, ActionResult } from '@/app/actions/bookings';
import { formatEUR } from '@/lib/format';

type Props = {
  booking?: Booking;
  properties: Property[];
  action: (data: BookingFormData) => Promise<ActionResult>;
};

function computeTotal(
  checkIn: string,
  checkOut: string,
  nightlyRate: string,
  cleaningFee: string,
): string {
  if (!checkIn || !checkOut || !nightlyRate) return '';
  const nights = Math.ceil(
    (new Date(checkOut).getTime() - new Date(checkIn).getTime()) /
      (1000 * 60 * 60 * 24),
  );
  if (nights <= 0) return '';
  const total =
    nights * parseFloat(nightlyRate) +
    (cleaningFee ? parseFloat(cleaningFee) : 0);
  return isNaN(total) ? '' : total.toFixed(2);
}

export function BookingForm({ booking, properties, action }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [checkIn, setCheckIn] = useState(booking?.check_in ?? '');
  const [checkOut, setCheckOut] = useState(booking?.check_out ?? '');
  const [nightlyRate, setNightlyRate] = useState(
    booking?.nightly_rate != null
      ? String(booking.nightly_rate / 100)
      : '',
  );
  const [cleaningFee, setCleaningFee] = useState(
    booking?.cleaning_fee != null
      ? String(booking.cleaning_fee / 100)
      : '',
  );

  const total = computeTotal(checkIn, checkOut, nightlyRate, cleaningFee);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const result = await action({
      property_id: fd.get('property_id') as string,
      guest_name: fd.get('guest_name') as string,
      guest_phone: fd.get('guest_phone') as string,
      guest_email: fd.get('guest_email') as string,
      check_in: fd.get('check_in') as string,
      check_out: fd.get('check_out') as string,
      nightly_rate: fd.get('nightly_rate') as string,
      cleaning_fee: fd.get('cleaning_fee') as string,
      deposit: fd.get('deposit') as string,
      source: fd.get('source') as string,
      status: fd.get('status') as string,
      notes: fd.get('notes') as string,
    });
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-4">
      {error && (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {error}
        </p>
      )}

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Property *
        </label>
        <select
          name="property_id"
          defaultValue={booking?.property_id ?? ''}
          required
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="">Select a property…</option>
          {properties.map((p) => (
            <option key={p.id} value={p.id}>
              {p.address}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Guest Name *
        </label>
        <input
          name="guest_name"
          defaultValue={booking?.guest_name ?? ''}
          required
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Guest Phone
          </label>
          <input
            name="guest_phone"
            type="tel"
            defaultValue={booking?.guest_phone ?? ''}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Guest Email
          </label>
          <input
            name="guest_email"
            type="email"
            defaultValue={booking?.guest_email ?? ''}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Check-in *
          </label>
          <input
            name="check_in"
            type="date"
            value={checkIn}
            onChange={(e) => setCheckIn(e.target.value)}
            required
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Check-out *
          </label>
          <input
            name="check_out"
            type="date"
            value={checkOut}
            onChange={(e) => setCheckOut(e.target.value)}
            required
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Nightly Rate (€) *
          </label>
          <input
            name="nightly_rate"
            type="number"
            step="0.01"
            min="0"
            value={nightlyRate}
            onChange={(e) => setNightlyRate(e.target.value)}
            required
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Cleaning Fee (€)
          </label>
          <input
            name="cleaning_fee"
            type="number"
            step="0.01"
            min="0"
            value={cleaningFee}
            onChange={(e) => setCleaningFee(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Deposit (€)
          </label>
          <input
            name="deposit"
            type="number"
            step="0.01"
            min="0"
            defaultValue={
              booking?.deposit != null ? booking.deposit / 100 : ''
            }
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
      </div>

      {total && (
        <p className="text-sm font-medium text-gray-900">
          Total: {formatEUR(Math.round(parseFloat(total) * 100))}
        </p>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Source
          </label>
          <select
            name="source"
            defaultValue={booking?.source ?? ''}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="">—</option>
            <option value="direct">Direct</option>
            <option value="airbnb">Airbnb</option>
            <option value="booking_com">Booking.com</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Status
          </label>
          <select
            name="status"
            defaultValue={booking?.status ?? 'confirmed'}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="confirmed">Confirmed</option>
            <option value="checked_in">Checked In</option>
            <option value="checked_out">Checked Out</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Notes
        </label>
        <textarea
          name="notes"
          defaultValue={booking?.notes ?? ''}
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
