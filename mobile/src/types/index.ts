export type Property = {
  id: string;
  address: string;
  type: 'apartment' | 'house' | 'commercial' | 'land';
  status: 'owned' | 'for_sale' | 'sold';
  purchase_date: string | null;
  purchase_price: number | null;
  current_value: number | null;
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

export type DashboardStats = {
  totalProperties: number;
  activeTenancies: number;
  monthlyIncome: number;
  occupancyRate: number;
};

export type Alert = {
  id: string;
  type: 'overdue_payment' | 'lease_expiring';
  message: string;
  tenancyId: string;
};

export type DashboardData = {
  stats: DashboardStats;
  alerts: Alert[];
  recentTransactions: Transaction[];
};
