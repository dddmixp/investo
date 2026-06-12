import { renderHook, waitFor } from '@testing-library/react-native';
import { useDashboard } from '../hooks/useDashboard';

jest.mock('../lib/supabase', () => ({ supabase: { from: jest.fn() } }));

import { supabase } from '../lib/supabase';

const mockFrom = supabase.from as jest.Mock;

function makeChain(result: { data?: unknown; error?: { message: string } | null; count?: number }) {
  const chain: Record<string, jest.Mock> = {};
  const methods = ['select', 'eq', 'gte', 'lte', 'order', 'limit'];
  methods.forEach((m) => {
    chain[m] = jest.fn(() => chain);
  });
  chain.then = jest.fn((resolve) =>
    Promise.resolve({
      data: result.data ?? null,
      error: result.error ?? null,
      count: result.count ?? null,
    }).then(resolve),
  );
  return chain;
}

const TODAY = new Date('2026-06-12');
const TODAY_DAY = TODAY.getDate(); // 12

function setupMocks({
  propertyCount = 3,
  tenancies = [] as { id: string; property_id: string; monthly_rent: number; payment_day: number; tenant_id: string }[],
  transactions = [] as unknown[],
  expiring = [] as unknown[],
  monthTx = [] as unknown[],
} = {}) {
  let callCount = 0;
  mockFrom.mockImplementation(() => {
    callCount++;
    if (callCount === 1) return makeChain({ count: propertyCount });
    if (callCount === 2) return makeChain({ data: tenancies });
    if (callCount === 3) return makeChain({ data: transactions });
    if (callCount === 4) return makeChain({ data: expiring });
    return makeChain({ data: monthTx });
  });
}

beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(TODAY);
  mockFrom.mockReset();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('useDashboard — alert logic', () => {
  it('generates overdue alert when payment_day < today and no payment recorded', async () => {
    setupMocks({
      tenancies: [{ id: 't1', property_id: 'p1', monthly_rent: 50000, payment_day: 5, tenant_id: 'u1' }],
      monthTx: [],
    });

    const { result } = renderHook(() => useDashboard());
    await waitFor(() => expect(result.current.loading).toBe(false));

    const overdue = result.current.data?.alerts.filter((a) => a.type === 'overdue_payment');
    expect(overdue).toHaveLength(1);
    expect(overdue![0].tenancyId).toBe('t1');
  });

  it('does NOT generate overdue alert when payment_day === today (grace period)', async () => {
    setupMocks({
      tenancies: [{ id: 't1', property_id: 'p1', monthly_rent: 50000, payment_day: TODAY_DAY, tenant_id: 'u1' }],
      monthTx: [],
    });

    const { result } = renderHook(() => useDashboard());
    await waitFor(() => expect(result.current.loading).toBe(false));

    const overdue = result.current.data?.alerts.filter((a) => a.type === 'overdue_payment');
    expect(overdue).toHaveLength(0);
  });

  it('does NOT generate overdue alert when rent already paid this month', async () => {
    setupMocks({
      tenancies: [{ id: 't1', property_id: 'p1', monthly_rent: 50000, payment_day: 5, tenant_id: 'u1' }],
      monthTx: [{ tenancy_id: 't1', date: '2026-06-05' }],
    });

    const { result } = renderHook(() => useDashboard());
    await waitFor(() => expect(result.current.loading).toBe(false));

    const overdue = result.current.data?.alerts.filter((a) => a.type === 'overdue_payment');
    expect(overdue).toHaveLength(0);
  });

  it('generates expiring alert for leases ending within 60 days', async () => {
    setupMocks({
      expiring: [{ id: 't2', property_id: 'p1', end_date: '2026-07-31', tenant_id: 'u2' }],
    });

    const { result } = renderHook(() => useDashboard());
    await waitFor(() => expect(result.current.loading).toBe(false));

    const expiring = result.current.data?.alerts.filter((a) => a.type === 'lease_expiring');
    expect(expiring).toHaveLength(1);
    expect(expiring![0].message).toContain('2026-07-31');
  });

  it('caps occupancy rate at 100% when active tenancies exceed properties', async () => {
    setupMocks({
      propertyCount: 2,
      tenancies: [
        { id: 't1', property_id: 'p1', monthly_rent: 50000, payment_day: 1, tenant_id: 'u1' },
        { id: 't2', property_id: 'p1', monthly_rent: 50000, payment_day: 1, tenant_id: 'u2' },
        { id: 't3', property_id: 'p2', monthly_rent: 50000, payment_day: 1, tenant_id: 'u3' },
      ],
    });

    const { result } = renderHook(() => useDashboard());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.data?.stats.occupancyRate).toBe(100);
  });

  it('sums monthly income across active tenancies', async () => {
    setupMocks({
      tenancies: [
        { id: 't1', property_id: 'p1', monthly_rent: 80000, payment_day: 1, tenant_id: 'u1' },
        { id: 't2', property_id: 'p2', monthly_rent: 60000, payment_day: 1, tenant_id: 'u2' },
      ],
    });

    const { result } = renderHook(() => useDashboard());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.data?.stats.monthlyIncome).toBe(140000);
  });

  it('treats payment_day=31 as last day of month in short months', async () => {
    // June 12 — June has 30 days, so payment_day=31 → effectiveDay=30 < 12 is false → no alert
    setupMocks({
      tenancies: [{ id: 't1', property_id: 'p1', monthly_rent: 50000, payment_day: 31, tenant_id: 'u1' }],
      monthTx: [],
    });

    const { result } = renderHook(() => useDashboard());
    await waitFor(() => expect(result.current.loading).toBe(false));

    // effectiveDay = min(31, 30) = 30; 30 < 12 = false → no overdue
    const overdue = result.current.data?.alerts.filter((a) => a.type === 'overdue_payment');
    expect(overdue).toHaveLength(0);
  });

  it('sets error state when Supabase returns an error', async () => {
    mockFrom.mockImplementation(() =>
      makeChain({ error: { message: 'permission denied' } }),
    );

    const { result } = renderHook(() => useDashboard());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error?.message).toBe('permission denied');
    expect(result.current.data).toBeNull();
  });
});
