import { describe, it, expect, vi, beforeEach } from 'vitest';
import { calcTotals, getCategoriesForType } from '@/lib/transactions';
import type { Transaction } from '@/types';

const base: Omit<
  Transaction,
  'id' | 'owner_id' | 'created_at' | 'property_id' | 'description' | 'tenancy_id' | 'booking_id'
> = {
  type: 'income',
  category: 'rent',
  amount: 0,
  date: '2026-06-01',
};

describe('calcTotals', () => {
  it('sums income, expenses, net correctly', () => {
    const txs = [
      {
        ...base,
        id: '1',
        owner_id: 'o',
        created_at: '',
        property_id: 'p',
        description: null,
        tenancy_id: null,
        booking_id: null,
        type: 'income' as const,
        amount: 80000,
      },
      {
        ...base,
        id: '2',
        owner_id: 'o',
        created_at: '',
        property_id: 'p',
        description: null,
        tenancy_id: null,
        booking_id: null,
        type: 'expense' as const,
        amount: 20000,
      },
    ];
    const t = calcTotals(txs);
    expect(t.income).toBe(80000);
    expect(t.expenses).toBe(20000);
    expect(t.net).toBe(60000);
  });

  it('returns zeros for empty array', () => {
    expect(calcTotals([])).toEqual({ income: 0, expenses: 0, net: 0 });
  });
});

describe('getCategoriesForType', () => {
  it('returns rent in income categories', () => {
    expect(getCategoriesForType('income')).toContain('rent');
  });
  it('returns maintenance in expense categories', () => {
    expect(getCategoriesForType('expense')).toContain('maintenance');
  });
});

// Server action tests
vi.mock('@/lib/supabase/server', () => ({ createServerClient: vi.fn() }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('next/navigation', () => ({ redirect: vi.fn() }));
import { createServerClient } from '@/lib/supabase/server';
import {
  createTransaction,
  deleteTransaction,
} from '@/app/actions/transactions';

const mockSupabase = { auth: { getUser: vi.fn() }, from: vi.fn() };
beforeEach(() => {
  vi.clearAllMocks();
  (createServerClient as ReturnType<typeof vi.fn>).mockResolvedValue(mockSupabase);
  mockSupabase.auth.getUser.mockResolvedValue({
    data: { user: { id: 'o1' } },
  });
});

describe('createTransaction validation', () => {
  it('requires property_id', async () => {
    expect(
      (
        await createTransaction({
          property_id: '',
          type: 'income',
          category: 'rent',
          amount: '500',
          date: '2026-06-01',
          description: '',
        })
      )?.error
    ).toBe('Property is required');
  });
  it('requires amount', async () => {
    expect(
      (
        await createTransaction({
          property_id: 'p1',
          type: 'income',
          category: 'rent',
          amount: '',
          date: '2026-06-01',
          description: '',
        })
      )?.error
    ).toBe('Amount is required');
  });
  it('converts EUR to cents on insert', async () => {
    const chain = {
      insert: vi.fn().mockResolvedValue({ error: null }),
      eq: vi.fn(),
    };
    mockSupabase.from.mockReturnValue(chain);
    await createTransaction({
      property_id: 'p1',
      type: 'income',
      category: 'rent',
      amount: '1500.50',
      date: '2026-06-01',
      description: '',
    }).catch(() => {});
    expect(chain.insert).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 150050 })
    );
  });
  it('rejects invalid transaction type', async () => {
    expect(
      (
        await createTransaction({
          property_id: 'p1',
          type: 'transfer',
          category: 'rent',
          amount: '500',
          date: '2026-06-01',
          description: '',
        })
      )?.error
    ).toBe('Invalid transaction type');
  });
  it('rejects non-positive amount', async () => {
    expect(
      (
        await createTransaction({
          property_id: 'p1',
          type: 'income',
          category: 'rent',
          amount: '0',
          date: '2026-06-01',
          description: '',
        })
      )?.error
    ).toBe('Amount must be positive');
  });
});

describe('deleteTransaction', () => {
  it('deletes and returns null on success', async () => {
    const chain = {
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
    };
    // resolve when awaited after the final .eq()
    chain.eq.mockReturnValueOnce(chain).mockResolvedValueOnce({ error: null });
    mockSupabase.from.mockReturnValue(chain);
    const result = await deleteTransaction('tx1');
    expect(chain.delete).toHaveBeenCalled();
    expect(chain.eq).toHaveBeenCalledWith('id', 'tx1');
    expect(chain.eq).toHaveBeenCalledWith('owner_id', 'o1');
    expect(result).toBeNull();
  });
  it('returns error when unauthenticated', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });
    expect((await deleteTransaction('tx1'))?.error).toBe('Not authenticated');
  });
});
