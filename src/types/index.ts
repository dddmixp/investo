export type Property = {
  id: string;
  owner_id: string;
  created_at: string;
  address: string;
  type: 'apartment' | 'house' | 'commercial' | 'land' | null;
  status: 'owned' | 'for_sale' | 'sold' | null;
  purchase_date: string | null;
  purchase_price: number | null;
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
  payment_day: number;
  status: 'active' | 'expired' | 'terminated' | null;
};
