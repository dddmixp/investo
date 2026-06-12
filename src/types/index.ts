export type Property = {
  id: string;
  owner_id: string;
  created_at: string;
  address: string;
  type: 'apartment' | 'house' | 'commercial' | 'land' | null;
  status: 'owned' | 'for_sale' | 'sold' | null;
  purchase_date: string | null;
  purchase_price: number | null; // EUR cents
  current_value: number | null;  // EUR cents
};

export type Tenant = {
  id: string;
  name: string;
  egn: string | null;
  phone: string | null;
  email: string | null;
  whatsapp: string | null;
  notes: string | null;
};

export type Tenancy = {
  id: string;
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
  property_id: string;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  date: string;
  description: string | null;
};

export type Document = {
  id: string;
  entity_type: string;
  entity_id: string;
  doc_type: string;
  filename: string;
  storage_path: string;
  extracted_data: Record<string, unknown> | null;
};
