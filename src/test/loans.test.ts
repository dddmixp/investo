import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { nextPaymentDate } from '@/lib/loans';

describe('nextPaymentDate', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns this month when the anniversary day is still ahead', () => {
    vi.setSystemTime(new Date(2026, 5, 5)); // 2026-06-05 local
    // Loan started on the 20th; next payment this month is 2026-06-20.
    expect(nextPaymentDate('2025-01-20', 120)).toBe('2026-06-20');
  });

  it('rolls into next month when the anniversary day already passed', () => {
    vi.setSystemTime(new Date(2026, 5, 25)); // 2026-06-25 local
    // Loan started on the 20th; June 20 has passed → 2026-07-20.
    expect(nextPaymentDate('2025-01-20', 120)).toBe('2026-07-20');
  });

  it('clamps day-31 starts into short months without overflowing', () => {
    vi.setSystemTime(new Date(2026, 1, 1)); // 2026-02-01 local
    // Start day 31; February 2026 has 28 days → clamp to 2026-02-28,
    // and must NOT overflow into March.
    expect(nextPaymentDate('2025-01-31', 120)).toBe('2026-02-28');
  });

  it('clamps day-31 into the next month when this month already passed', () => {
    vi.setSystemTime(new Date(2026, 3, 30)); // 2026-04-30 local
    // April has 30 days → April 30 is today (not before), so candidate is
    // 2026-04-30 itself.
    expect(nextPaymentDate('2025-01-31', 120)).toBe('2026-04-30');
  });

  it('returns null when the loan term has already expired', () => {
    vi.setSystemTime(new Date(2026, 5, 1)); // 2026-06-01 local
    // 6-month term from 2025-01-15 ends 2025-07-15, well in the past.
    expect(nextPaymentDate('2025-01-15', 6)).toBeNull();
  });

  it('returns null for an invalid date string', () => {
    vi.setSystemTime(new Date(2026, 5, 1));
    expect(nextPaymentDate('not-a-date', 120)).toBeNull();
  });

  it('never returns null when term_months is null', () => {
    vi.setSystemTime(new Date(2026, 5, 10)); // 2026-06-10
    expect(nextPaymentDate('2020-01-15', null)).toBe('2026-06-15');
  });
});
