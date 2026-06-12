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

export type Property = {
  id: string;
  address: string;
};

export type Tenant = {
  id: string;
  name: string;
};
