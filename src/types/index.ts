export type Property = {
  id: string;
  owner_id: string;
  created_at: string;
  address: string;
  type: 'apartment' | 'house' | 'commercial' | 'land' | null;
  status: 'owned' | 'for_sale' | 'sold' | null;
  purchase_date: string | null;
  /** EUR cents */
  purchase_price: number | null;
  /** EUR cents */
  current_value: number | null;
};

export type Tenant = {
  id: string;
  owner_id: string;
  created_at: string;
  name: string;
  egn: string | null;
  phone: string | null;
  email: string | null;
  whatsapp: string | null;
  notes: string | null;
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
  deposit: number | null;
  /** @range 1-31 */
  payment_day: number;
  status: 'active' | 'expired' | 'terminated' | null;
};

export type Transaction = {
  id: string;
  owner_id: string;
  created_at: string;
  property_id: string;
  type: 'income' | 'expense';
  category: string | null;
  amount: number;
  date: string;
  description: string | null;
  tenancy_id: string | null;
  booking_id: string | null;
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
  nightly_rate: number | null;
  total_amount: number | null;
  cleaning_fee: number | null;
  deposit: number | null;
  source: 'direct' | 'airbnb' | 'booking_com' | 'other' | null;
  status: 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled' | null;
};
