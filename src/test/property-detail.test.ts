import { describe, it, expect } from 'vitest';

// Test helper functions extracted from the page logic
function calcAppreciation(
  purchasePrice: number | null,
  currentValue: number | null,
): string | null {
  if (!purchasePrice || !currentValue) return null;
  return (
    ((currentValue - purchasePrice) / purchasePrice) *
    100
  ).toFixed(1);
}

describe('calcAppreciation', () => {
  it('returns null when values missing', () => {
    expect(calcAppreciation(null, null)).toBeNull();
    expect(calcAppreciation(100000, null)).toBeNull();
  });
  it('calculates positive appreciation', () => {
    expect(calcAppreciation(100000, 120000)).toBe('20.0');
  });
  it('calculates negative appreciation', () => {
    expect(calcAppreciation(100000, 80000)).toBe('-20.0');
  });
});
