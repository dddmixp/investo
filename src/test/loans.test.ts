import { describe, it, expect } from 'vitest';
import { nextPaymentDate } from '@/lib/loans';

describe('nextPaymentDate', () => {
  it('returns null for empty start_date', () => {
    expect(nextPaymentDate('', null)).toBeNull();
  });

  it('returns a future date string', () => {
    const result = nextPaymentDate('2020-01-01', null);
    expect(result).toBeTruthy();
    expect(new Date(result!).getTime()).toBeGreaterThan(Date.now());
  });

  it('returns null when loan is paid off (past term end)', () => {
    expect(nextPaymentDate('2020-01-01', 12)).toBeNull();
  });
});

import { vi, beforeEach } from 'vitest';
vi.mock('@/lib/supabase/server', () => ({ createServerClient: vi.fn() }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('next/navigation', () => ({ redirect: vi.fn() }));
import { createServerClient } from '@/lib/supabase/server';
import { createLoan } from '@/app/actions/loans';

const mockSupabase = { auth: { getUser: vi.fn() }, from: vi.fn() };
beforeEach(() => {
  vi.clearAllMocks();
  (createServerClient as ReturnType<typeof vi.fn>).mockResolvedValue(mockSupabase);
  mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'o1' } } });
});

describe('createLoan validation', () => {
  it('requires property_id', async () => {
    expect(
      (
        await createLoan({
          property_id: '',
          lender: 'Bank',
          principal: '100000',
          interest_rate: '',
          rate_type: '',
          term_months: '',
          start_date: '',
          monthly_payment: '',
          outstanding: '',
        })
      )?.error,
    ).toBe('Property is required');
  });
  it('converts principal to cents', async () => {
    const chain = { insert: vi.fn().mockResolvedValue({ error: null }) };
    mockSupabase.from.mockReturnValue(chain);
    await createLoan({
      property_id: 'p1',
      lender: 'Bank',
      principal: '200000.50',
      interest_rate: '3.5',
      rate_type: 'fixed',
      term_months: '240',
      start_date: '2026-01-01',
      monthly_payment: '800',
      outstanding: '',
    }).catch(() => {});
    expect(chain.insert).toHaveBeenCalledWith(
      expect.objectContaining({ principal: 20000050 }),
    );
  });
});
