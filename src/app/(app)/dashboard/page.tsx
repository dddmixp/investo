import { formatEUR } from '@/lib/format';
import { getOverdueAlerts, getExpiryAlerts, getLoanPaymentAlerts } from '@/lib/dashboard';
import { nextPaymentDate } from '@/lib/loans';
import { StatCard } from '@/components/dashboard/StatCard';
import { AlertSection } from '@/components/dashboard/AlertSection';
import { RecentTransactions } from '@/components/dashboard/RecentTransactions';
import { QuickActions } from '@/components/dashboard/QuickActions';
import type { Property, Transaction, Loan } from '@/types';

// ---------------------------------------------------------------------------
// Data-fetching helpers
// ---------------------------------------------------------------------------

type TenancyRow = {
  id: string;
  property_id: string;
  monthly_rent: number;
  payment_day: number;
  end_date: string | null;
  is_active: boolean;
  tenant_name: string | null;
};

async function fetchDashboardData(): Promise<{
  properties: Property[];
  tenancies: TenancyRow[];
  transactions: Transaction[];
  loans: Loan[];
  hasError: boolean;
}> {
  try {
    const { createServerClient } = await import('@/lib/supabase/server');
    const supabase = await createServerClient();

    const now = new Date();
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const [propertiesRes, tenanciesRes, transactionsRes, loansRes] = await Promise.all([
      supabase
        .from('properties')
        .select('id, address, status, purchase_price, current_value'),
      supabase
        .from('tenancies')
        .select(
          'id, property_id, monthly_rent, payment_day, end_date, status, tenants(name)',
        ),
      supabase
        .from('transactions')
        .select('id, property_id, amount, type, category, notes, created_at')
        .gte('created_at', firstOfMonth)
        .order('created_at', { ascending: false })
        .limit(10),
      supabase
        .from('loans')
        .select('id, property_id, lender, principal, start_date, term_months'),
    ]);

    // Surface any query errors instead of silently swallowing them.
    let hasError = false;
    for (const [label, res] of [
      ['properties', propertiesRes],
      ['tenancies', tenanciesRes],
      ['transactions', transactionsRes],
      ['loans', loansRes],
    ] as const) {
      if (res.error) {
        hasError = true;
        console.error(`Dashboard query failed (${label}):`, res.error);
      }
    }

    const properties: Property[] = (propertiesRes.data ?? []) as Property[];

    const tenancies: TenancyRow[] = ((tenanciesRes.data ?? []) as unknown as Array<{
      id: string;
      property_id: string;
      monthly_rent: number;
      payment_day: number;
      end_date: string | null;
      status: 'active' | 'expired' | 'terminated' | null;
      tenants: { name: string } | null;
    }>).map((t) => ({
      id: t.id,
      property_id: t.property_id,
      monthly_rent: t.monthly_rent,
      payment_day: t.payment_day,
      end_date: t.end_date,
      is_active: t.status === 'active',
      tenant_name: t.tenants?.name ?? null,
    }));

    const transactions: Transaction[] = (transactionsRes.data ?? []) as unknown as Transaction[];
    const loans: Loan[] = (loansRes.data ?? []) as unknown as Loan[];

    return { properties, tenancies, transactions, loans, hasError };
  } catch (err) {
    // Supabase not yet configured — return empty data for build-time safety.
    console.error('Dashboard data fetch failed:', err);
    return {
      properties: [],
      tenancies: [],
      transactions: [],
      loans: [],
      hasError: true,
    };
  }
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function DashboardPage() {
  const { properties, tenancies, transactions, loans, hasError } =
    await fetchDashboardData();

  const activeTenancies = tenancies.filter((t) => t.is_active);
  const activeTenancyCount = activeTenancies.length;
  const monthlyRentalIncome = activeTenancies.reduce(
    (sum, t) => sum + t.monthly_rent,
    0,
  );
  const occupancyRate = Math.min(
    Math.round((activeTenancyCount / Math.max(properties.length, 1)) * 100),
    100,
  );

  // For the MVP we show all active tenancies past their payment day as overdue.
  // A real implementation would cross-reference with payment transactions.
  const overdueAlerts = getOverdueAlerts(tenancies, new Set());
  const expiryAlerts = getExpiryAlerts(tenancies);
  const loanAlerts = getLoanPaymentAlerts(loans, nextPaymentDate);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Dashboard</h1>

      {hasError && (
        <div className="mb-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          Some dashboard data could not be loaded. The figures shown may be
          incomplete.
        </div>
      )}

      {/* Stats row */}
      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Properties" value={properties.length} />
        <StatCard label="Active Tenancies" value={activeTenancyCount} />
        <StatCard label="Monthly Income" value={formatEUR(monthlyRentalIncome)} />
        <StatCard label="Occupancy" value={`${occupancyRate}%`} />
      </div>

      {/* Alerts */}
      {overdueAlerts.length > 0 && (
        <AlertSection title="Overdue Payments" items={overdueAlerts} type="overdue" />
      )}
      {expiryAlerts.length > 0 && (
        <AlertSection title="Lease Expiring Soon" items={expiryAlerts} type="expiry" />
      )}
      {loanAlerts.length > 0 && (
        <AlertSection title="Loan Payments Due" items={loanAlerts} type="loan" />
      )}

      {/* Recent Transactions (already limited to 10 by the query) */}
      <RecentTransactions transactions={transactions} />

      {/* Quick Actions */}
      <QuickActions />
    </div>
  );
}
