import { describe, it, expect } from 'vitest';
import { formatEUR } from '@/lib/format';

describe('formatEUR', () => {
  it('formats zero', () => {
    const result = formatEUR(0);
    expect(result).toContain('0');
  });
  it('formats 1 cent', () => {
    const result = formatEUR(1);
    expect(result).toContain('0,01');
  });
  it('formats large value', () => {
    const result = formatEUR(150050);
    expect(result).toContain('1.500');
  });
});
