export type Property = {
  id: string;
  owner_id: string;
  created_at: string;
  address: string;
  type: 'apartment' | 'house' | 'commercial' | 'land';
  status: 'owned' | 'for_sale' | 'sold';
  purchase_date: string | null;
  purchase_price: number | null;
  current_value: number | null;
};

export type Tenant = {
  id: string;
  owner_id: string;
  created_at: string;
  name: string;
  /** GDPR PII — encrypted before storage */
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
  payment_day: number;
  status: 'active' | 'expired' | 'terminated';
};

export type Transaction = {
  id: string;
  owner_id: string;
  created_at: string;
  property_id: string;
  type: 'income' | 'expense';
  category: string;
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

export type Document = {
  id: string;
  owner_id: string;
  created_at: string;
  entity_type: 'property' | 'tenancy' | 'booking' | 'transaction' | 'loan';
  entity_id: string;
  doc_type: 'purchase_deed' | 'rental_contract' | 'loan_agreement' | 'invoice' | 'insurance' | 'utility_bill' | 'permit' | 'other' | null;
  filename: string;
  storage_path: string;
  extracted_data: Record<string, unknown> | null;
  notes: string | null;
};

export type Message = {
  id: string;
  owner_id: string;
  created_at: string;
  tenant_id: string | null;
  direction: 'outbound' | 'inbound' | null;
  channel: 'inapp' | 'email' | 'whatsapp' | 'phone' | null;
  body: string | null;
  read: boolean;
};
