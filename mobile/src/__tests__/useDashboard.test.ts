import { describe, it, expect, vi, beforeEach } from 'vitest';
import { formatEUR } from '../lib/format';

// Seeded per-table query results.
let tableResults: Record<string, { data: unknown[]; error: unknown }>;
let rentTxResult: { data: unknown[]; error: unknown };

// A chainable builder. `transactions` is queried twice (recent + rent-this-month);
// the rent query is distinguished by the presence of an `.eq('category','rent')` call.
function makeBuilder(table: string) {
  let isRentQuery = false;
  const builder: Record<string, unknown> = {};
  const self = () => builder;
  builder.select = vi.fn(self);
  builder.order = vi.fn(self);
  builder.limit = vi.fn(self);
  builder.gte = vi.fn(self);
  builder.eq = vi.fn((col: string, val: string) => {
    if (col === 'category' && val === 'rent') isRentQuery = true;
    return builder;
  });
  (builder as { then: unknown }).then = (
    resolve: (v: { data: unknown[]; error: unknown }) => void,
  ) => {
    if (table === 'transactions' && isRentQuery) return resolve(rentTxResult);
    return resolve(tableResults[table] ?? { data: [], error: null });
  };
  return builder;
}

vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } }, error: null }),
    },
    from: vi.fn((table: string) => makeBuilder(table)),
  },
}));

// Capture the state the hook commits via setData/setError.
let committed: { data: unknown; error: string | null };

vi.mock('react', async () => {
  const actual = await vi.importActual<typeof import('react')>('react');
  return {
    ...actual,
    useState: (init: unknown) => {
      // data -> null, loading -> false, error -> null on first calls.
      const setter = (v: unknown) => {
        if (v && typeof v === 'object') committed.data = v;
        else if (typeof v === 'string') committed.error = v;
      };
      return [init, setter];
    },
    useCallback: (fn: unknown) => fn,
  };
});

beforeEach(() => {
  vi.clearAllMocks();
  committed = { data: null, error: null };
  tableResults = {
    properties: { data: [{ id: 'p1' }, { id: 'p2' }, { id: 'p3' }, { id: 'p4' }], error: null },
    tenancies: {
      data: [
        // Active, paid this month (must NOT be overdue).
        { id: 't1', property_id: 'p1', monthly_rent: 100000, payment_day: 1, end_date: null, status: 'active' },
        // Active, unpaid, payment_day in the past => overdue.
        { id: 't2', property_id: 'p2', monthly_rent: 80000, payment_day: 1, end_date: null, status: 'active' },
        // Active, expiring within 60 days.
        { id: 't3', property_id: 'p3', monthly_rent: 50000, payment_day: 1, end_date: '2999-01-01', status: 'active' },
        // Inactive => ignored everywhere.
        { id: 't4', property_id: 'p4', monthly_rent: 999999, payment_day: 1, end_date: null, status: 'terminated' },
      ],
      error: null,
    },
    transactions: {
      data: [{ id: 'tx1', type: 'income', amount: 100000, category: 'rent', date: '2026-06-10' }],
      error: null,
    },
  };
  // t1 paid rent this month.
  rentTxResult = { data: [{ tenancy_id: 't1' }], error: null };
});

describe('useDashboard.refresh', () => {
  it('computes monthly income, occupancy, overdue and recent transactions', async () => {
    const { useDashboard } = await import('../hooks/useDashboard');
    const { refresh } = useDashboard();
    await refresh();

    const data = committed.data as {
      totalProperties: number;
      activeTenancyCount: number;
      monthlyIncomeCents: number;
      occupancyRate: number;
      overdueAlerts: { tenancy_id: string }[];
      recentTransactions: { id: string }[];
    };

    expect(committed.error).toBeNull();
    expect(data.totalProperties).toBe(4);
    expect(data.activeTenancyCount).toBe(3);
    // 100000 + 80000 + 50000 (active only).
    expect(data.monthlyIncomeCents).toBe(230000);
    // 3 active / 4 properties = 75%.
    expect(data.occupancyRate).toBe(75);
    // t1 paid -> excluded; t2 unpaid -> overdue; t3 future payment? payment_day 1 < today.
    const overdueIds = data.overdueAlerts.map((a) => a.tenancy_id);
    expect(overdueIds).toContain('t2');
    expect(overdueIds).not.toContain('t1');
    expect(data.recentTransactions).toHaveLength(1);
  });

  it('surfaces a query error instead of swallowing it', async () => {
    tableResults.tenancies = { data: [], error: { message: 'boom' } };
    const { useDashboard } = await import('../hooks/useDashboard');
    const { refresh } = useDashboard();
    await refresh();
    expect(committed.error).toBe('boom');
  });
});

describe('formatEUR (shared module)', () => {
  it('formats cents as EUR', () => {
    expect(formatEUR(100000)).toContain('1.000');
    expect(formatEUR(0)).toContain('0');
  });
});
