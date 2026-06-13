import { createServerClient } from '@/lib/supabase/server';
import type { Property } from '@/types';
import { createBooking } from '@/app/actions/bookings';
import { BookingForm } from '@/components/bookings/BookingForm';

export default async function NewBookingPage() {
  const supabase = await createServerClient();
  const { data: properties } = await supabase
    .from('properties')
    .select('id, address')
    .order('address');

  const props = (properties ?? []) as Property[];

  return (
    <div>
      <h1 className="mb-6 text-xl font-bold text-gray-900">Add Booking</h1>
      <BookingForm properties={props} action={createBooking} />
    </div>
  );
}
