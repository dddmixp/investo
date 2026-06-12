export type Property = {
  id: string;
  owner_id: string;
  created_at: string;
  address: string;
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
