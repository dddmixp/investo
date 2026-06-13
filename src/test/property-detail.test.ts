import { describe, it, expect } from 'vitest';
import { calcAppreciation } from '@/lib/properties';

describe('calcAppreciation', () => {
  it('returns null when values missing', () => {
    expect(calcAppreciation(null, null)).toBeNull();
    expect(calcAppreciation(100000, null)).toBeNull();
    expect(calcAppreciation(null, 120000)).toBeNull();
  });
  it('returns null when purchase price is zero (avoids divide-by-zero)', () => {
    expect(calcAppreciation(0, 120000)).toBeNull();
  });
  it('handles a current value of zero', () => {
    expect(calcAppreciation(100000, 0)).toBe('-100.0');
  });
  it('calculates positive appreciation', () => {
    expect(calcAppreciation(100000, 120000)).toBe('20.0');
  });
  it('calculates negative appreciation', () => {
    expect(calcAppreciation(100000, 80000)).toBe('-20.0');
  });
});
