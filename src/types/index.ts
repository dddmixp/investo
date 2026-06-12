export type Property = {
  id: string;
  owner_id: string;
  created_at: string;
  address: string;
  type: 'apartment' | 'house' | 'commercial' | 'land' | null;
  status: 'owned' | 'for_sale' | 'sold' | null;
  purchase_date: string | null;
  purchase_price: number | null; // EUR cents
  current_value: number | null; // EUR cents
};

export type BookingStatus = 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled';
export type BookingSource = 'direct' | 'airbnb' | 'booking_com' | 'other' | null;

export type Booking = {
  id: string;
  owner_id: string;
  created_at: string;
  property_id: string;
  guest_name: string;
  guest_phone: string | null;
  guest_email: string | null;
  check_in: string;
  check_out: string;
  nightly_rate: number;
  cleaning_fee: number | null;
  deposit: number | null;
  source: BookingSource;
  status: BookingStatus;
  total_amount: number;
  notes: string | null;
};
