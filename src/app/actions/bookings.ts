'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';
import { calcBookingTotal, hasOverlap } from '@/lib/bookings';
import type { BookingStatus, BookingSource } from '@/types';

export type BookingFormData = {
  property_id: string;
  guest_name: string;
  guest_phone: string;
  guest_email: string;
  check_in: string;
  check_out: string;
  nightly_rate: string;
  cleaning_fee: string;
  deposit: string;
  source: string;
  status: string;
  notes: string;
};

export type ActionResult = { error: string } | null;

const BOOKING_STATUSES: readonly BookingStatus[] = [
  'confirmed',
  'checked_in',
  'checked_out',
  'cancelled',
];
const BOOKING_SOURCES: readonly NonNullable<BookingSource>[] = [
  'direct',
  'airbnb',
  'booking_com',
  'other',
];

/**
 * Validate the fields shared by create and update. Returns an error result if
 * any field is invalid, otherwise null.
 */
function validateBookingData(data: BookingFormData): ActionResult {
  if (!data.property_id) return { error: 'Property is required' };
  if (!data.guest_name.trim()) return { error: 'Guest name is required' };
  if (!data.check_in) return { error: 'Check-in date is required' };
  if (!data.check_out) return { error: 'Check-out date is required' };
  if (new Date(data.check_out) <= new Date(data.check_in))
    return { error: 'Check-out must be after check-in' };
  if (!data.nightly_rate || parseFloat(data.nightly_rate) <= 0)
    return { error: 'Nightly rate is required' };
  if (data.status && !BOOKING_STATUSES.includes(data.status as BookingStatus))
    return { error: 'Invalid booking status' };
  if (data.source && !BOOKING_SOURCES.includes(data.source as NonNullable<BookingSource>))
    return { error: 'Invalid booking source' };
  return null;
}

export async function createBooking(
  data: BookingFormData,
): Promise<ActionResult> {
  const validationError = validateBookingData(data);
  if (validationError) return validationError;

  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const { data: existing } = await supabase
    .from('bookings')
    .select('id, check_in, check_out, property_id, status')
    .eq('property_id', data.property_id);

  if (
    hasOverlap(
      data.check_in,
      data.check_out,
      data.property_id,
      existing ?? [],
    )
  ) {
    return { error: 'This property is already booked for the selected dates' };
  }

  const nightlyRateCents = Math.round(parseFloat(data.nightly_rate) * 100);
  const cleaningFeeCents = data.cleaning_fee
    ? Math.round(parseFloat(data.cleaning_fee) * 100)
    : null;
  const depositCents = data.deposit
    ? Math.round(parseFloat(data.deposit) * 100)
    : null;
  const totalAmount =
    calcBookingTotal(
      data.check_in,
      data.check_out,
      parseFloat(data.nightly_rate),
      data.cleaning_fee ? parseFloat(data.cleaning_fee) : null,
    ) * 100;

  const { error } = await supabase.from('bookings').insert({
    owner_id: user.id,
    property_id: data.property_id,
    guest_name: data.guest_name.trim(),
    guest_phone: data.guest_phone || null,
    guest_email: data.guest_email || null,
    check_in: data.check_in,
    check_out: data.check_out,
    nightly_rate: nightlyRateCents,
    cleaning_fee: cleaningFeeCents,
    deposit: depositCents,
    source: (data.source as BookingSource) || null,
    status: (data.status as BookingStatus) || 'confirmed',
    total_amount: Math.round(totalAmount),
    notes: data.notes || null,
  });

  if (error) return { error: error.message };
  revalidatePath('/bookings');
  redirect('/bookings');
}

export async function updateBooking(
  id: string,
  data: BookingFormData,
): Promise<ActionResult> {
  const validationError = validateBookingData(data);
  if (validationError) return validationError;

  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const { data: existing } = await supabase
    .from('bookings')
    .select('id, check_in, check_out, property_id, status')
    .eq('property_id', data.property_id);

  if (
    hasOverlap(
      data.check_in,
      data.check_out,
      data.property_id,
      existing ?? [],
      id,
    )
  ) {
    return { error: 'This property is already booked for the selected dates' };
  }

  const nightlyRateCents = Math.round(parseFloat(data.nightly_rate) * 100);
  const cleaningFeeCents = data.cleaning_fee
    ? Math.round(parseFloat(data.cleaning_fee) * 100)
    : null;
  const depositCents = data.deposit
    ? Math.round(parseFloat(data.deposit) * 100)
    : null;
  const totalAmount =
    calcBookingTotal(
      data.check_in,
      data.check_out,
      parseFloat(data.nightly_rate),
      data.cleaning_fee ? parseFloat(data.cleaning_fee) : null,
    ) * 100;

  const { error } = await supabase
    .from('bookings')
    .update({
      property_id: data.property_id,
      guest_name: data.guest_name.trim(),
      guest_phone: data.guest_phone || null,
      guest_email: data.guest_email || null,
      check_in: data.check_in,
      check_out: data.check_out,
      nightly_rate: nightlyRateCents,
      cleaning_fee: cleaningFeeCents,
      deposit: depositCents,
      source: (data.source as BookingSource) || null,
      status: (data.status as BookingStatus) || 'confirmed',
      total_amount: Math.round(totalAmount),
      notes: data.notes || null,
    })
    .eq('id', id)
    .eq('owner_id', user.id);

  if (error) return { error: error.message };
  revalidatePath('/bookings');
  redirect('/bookings');
}

export async function deleteBooking(id: string): Promise<ActionResult> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const { error } = await supabase
    .from('bookings')
    .delete()
    .eq('id', id)
    .eq('owner_id', user.id);

  if (error) return { error: error.message };
  revalidatePath('/bookings');
  return null;
}
