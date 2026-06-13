import { notFound } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';
import type { Booking, Property } from '@/types';
import { updateBooking } from '@/app/actions/bookings';
import { BookingForm } from '@/components/bookings/BookingForm';

export default async function EditBookingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) notFound();

  const [{ data: bookingData }, { data: propertiesData }] = await Promise.all([
    supabase
      .from('bookings')
      .select('*')
      .eq('id', id)
      .eq('owner_id', user.id)
      .single(),
    supabase.from('properties').select('id, address').order('address'),
  ]);

  if (!bookingData) notFound();

  const booking = bookingData as Booking;
  const properties = (propertiesData ?? []) as Property[];

  const action = async (formData: Parameters<typeof updateBooking>[1]) =>
    updateBooking(id, formData);

  return (
    <div>
      <h1 className="mb-6 text-xl font-bold text-gray-900">Edit Booking</h1>
      <BookingForm booking={booking} properties={properties} action={action} />
    </div>
  );
}
