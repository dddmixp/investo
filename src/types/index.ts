export type PropertyStatus = 'active' | 'for_sale' | 'sold' | 'renovation';

export interface Property {
  id: string;
  address: string;
  status: PropertyStatus;
  purchase_price: number | null;
  current_value: number | null;
}

export interface Tenant {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
}

export interface Tenancy {
  id: string;
  property_id: string;
  tenant_id: string;
  monthly_rent: number;
  payment_day: number;
  start_date: string;
  end_date: string | null;
  is_active: boolean;
}

export interface Transaction {
  id: string;
  property_id: string | null;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  notes: string | null;
  created_at: string;
}

export interface Loan {
  id: string;
  property_id: string;
  lender: string;
  amount: number;
  start_date: string | null;
  term_months: number | null;
}

export interface Document {
  id: string;
  entity_type: string;
  entity_id: string;
  file_path: string;
  created_at: string;
}
