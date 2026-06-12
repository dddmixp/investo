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

export type Property = {
  id: string;
  address: string;
};
