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

export type Tenancy = {
  id: string;
  owner_id: string;
  created_at: string;
  property_id: string;
  tenant_id: string;
  start_date: string;
  end_date: string | null;
  monthly_rent: number;
  payment_day: number;
  is_active: boolean;
};

export type Transaction = {
  id: string;
  owner_id: string;
  created_at: string;
  property_id: string | null;
  type: 'income' | 'expense';
  category: string | null;
  amount: number;
  notes: string | null;
  date: string;
};

export type Loan = {
  id: string;
  owner_id: string;
  created_at: string;
  property_id: string;
  lender: string;
  principal: number;
  interest_rate: number | null;
  rate_type: 'fixed' | 'variable' | null;
  term_months: number | null;
  start_date: string | null;
  monthly_payment: number | null;
  outstanding: number | null;
};

export type Document = {
  id: string;
  owner_id: string;
  created_at: string;
  entity_type: string;
  entity_id: string;
  filename: string;
  doc_type: string | null;
  storage_path: string;
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
