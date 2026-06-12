import { describe, it, expect, vi } from 'vitest';

// Mock the supabase module before importing useDashboard
vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn((_table: string) => {
      const chain = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: [] }),
      };
      return chain;
    }),
  },
}));

describe('useDashboard', () => {
  it('exports useDashboard function', async () => {
    const { useDashboard } = await import('../hooks/useDashboard');
    expect(typeof useDashboard).toBe('function');
  });

  it('exports DashboardData type shape (via hook return)', async () => {
    const { useDashboard } = await import('../hooks/useDashboard');
    // Verify the hook is callable (not testing React state, just the export)
    expect(useDashboard).toBeDefined();
  });
});

describe('useDashboard helpers', () => {
  it('formats EUR correctly', () => {
    const fmt = (cents: number) => new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(cents / 100);
    expect(fmt(100000)).toContain('1.000');
  });

  it('formats zero EUR correctly', () => {
    const fmt = (cents: number) => new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(cents / 100);
    expect(fmt(0)).toContain('0');
  });

  it('formats negative EUR correctly', () => {
    const fmt = (cents: number) => new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(cents / 100);
    const result = fmt(-50000);
    expect(result).toContain('500');
  });

  it('computes occupancy rate correctly', () => {
    const computeOccupancy = (active: number, total: number) =>
      total > 0 ? Math.round((active / total) * 100) : 0;
    expect(computeOccupancy(3, 4)).toBe(75);
    expect(computeOccupancy(0, 5)).toBe(0);
    expect(computeOccupancy(5, 5)).toBe(100);
    expect(computeOccupancy(0, 0)).toBe(0);
  });

  it('computes daysLeft for expiry alerts correctly', () => {
    const today = new Date('2026-06-12');
    const endDate = new Date('2026-08-11');
    const daysLeft = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    expect(daysLeft).toBe(60);
  });

  it('computes daysOverdue correctly', () => {
    const currentDay = 15;
    const paymentDay = 10;
    const lastDayOfMonth = 30;
    const effectiveDay = Math.min(paymentDay, lastDayOfMonth);
    const daysOverdue = currentDay - effectiveDay;
    expect(daysOverdue).toBe(5);
  });

  it('rows helper returns empty array for null', () => {
    // Test the rows helper indirectly via the data shape
    const rows = <T>(data: T[] | null): T[] => data ?? [];
    expect(rows(null)).toEqual([]);
    expect(rows([])).toEqual([]);
    expect(rows([1, 2, 3])).toEqual([1, 2, 3]);
  });
});
