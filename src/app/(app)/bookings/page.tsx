import Link from 'next/link';
import { createServerClient } from '@/lib/supabase/server';
import type { Booking, Property } from '@/types';
import { formatEUR } from '@/lib/format';
import { StatusBadge } from '@/components/bookings/StatusBadge';
import { DeleteBookingButton } from '@/components/bookings/DeleteBookingButton';
import { OccupancyCalendar } from '@/components/bookings/OccupancyCalendar';

type BookingWithProperty = Booking & { properties: Pick<Property, 'address'> | null };

export default async function BookingsPage() {
  const supabase = await createServerClient();
  const { data: bookings } = await supabase
    .from('bookings')
    .select('*, properties(address)')
    .order('check_in', { ascending: false });

  const rows = (bookings ?? []) as BookingWithProperty[];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Bookings</h1>
        <Link
          href="/bookings/new"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Add Booking
        </Link>
      </div>

      <div className="mb-6">
        <OccupancyCalendar bookings={rows} />
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-gray-500">No bookings yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-left">
                <th className="px-4 py-3 font-medium text-gray-600">
                  Property
                </th>
                <th className="px-4 py-3 font-medium text-gray-600">Guest</th>
                <th className="px-4 py-3 font-medium text-gray-600">
                  Check-in
                </th>
                <th className="px-4 py-3 font-medium text-gray-600">
                  Check-out
                </th>
                <th className="px-4 py-3 font-medium text-gray-600">Total</th>
                <th className="px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((b) => (
                <tr key={b.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-600">
                    {b.properties?.address ?? '—'}
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {b.guest_name}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{b.check_in}</td>
                  <td className="px-4 py-3 text-gray-600">{b.check_out}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {formatEUR(b.total_amount)}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={b.status} />
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex gap-3">
                      <Link
                        href={`/bookings/${b.id}/edit`}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        Edit
                      </Link>
                      <DeleteBookingButton id={b.id} />
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
