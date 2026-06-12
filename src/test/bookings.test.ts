import { describe, it, expect } from 'vitest';
import { calcBookingTotal, hasOverlap } from '@/lib/bookings';

describe('calcBookingTotal', () => {
  it('3 nights at 100 + cleaning 50 = 350 EUR (in cents logic)', () => {
    expect(calcBookingTotal('2026-06-01', '2026-06-04', 100, 50)).toBe(350);
  });
  it('no cleaning fee', () => {
    expect(calcBookingTotal('2026-06-01', '2026-06-03', 80, null)).toBe(160);
  });
});

describe('hasOverlap', () => {
  const existing = [
    {
      check_in: '2026-06-10',
      check_out: '2026-06-15',
      property_id: 'p1',
      status: 'confirmed',
      id: 'b1',
    },
  ];
  it('detects overlap', () => {
    expect(hasOverlap('2026-06-12', '2026-06-18', 'p1', existing)).toBe(true);
  });
  it('no overlap different dates', () => {
    expect(hasOverlap('2026-06-16', '2026-06-20', 'p1', existing)).toBe(false);
  });
  it('cancelled booking not counted', () => {
    const cancelled = [{ ...existing[0], status: 'cancelled' }];
    expect(hasOverlap('2026-06-12', '2026-06-18', 'p1', cancelled)).toBe(
      false,
    );
  });
  it('excludes self on update', () => {
    expect(
      hasOverlap('2026-06-10', '2026-06-15', 'p1', existing, 'b1'),
    ).toBe(false);
  });
  it('different property no overlap', () => {
    expect(hasOverlap('2026-06-12', '2026-06-18', 'p2', existing)).toBe(false);
  });
});
