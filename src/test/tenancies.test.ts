import { describe, it, expect, vi, beforeEach } from 'vitest';
import { isOverdue, isExpired } from '@/lib/tenancies';
import type { Tenancy } from '@/types';

const base: Tenancy = {
  id: 't1',
  owner_id: 'o1',
  created_at: '2026-01-01',
  property_id: 'p1',
  tenant_id: 'u1',
  start_date: '2026-01-01',
  end_date: null,
  monthly_rent: 50000,
  deposit: null,
  payment_day: 1,
  status: 'active',
};

describe('isOverdue', () => {
  it('returns false when rent is already paid', () => {
    expect(isOverdue(base, new Set(['t1']))).toBe(false);
  });

  it('returns true when payment_day is in the past and unpaid', () => {
    const today = new Date();
    const pastDay = Math.max(1, today.getDate() - 2);
    expect(isOverdue({ ...base, payment_day: pastDay }, new Set())).toBe(true);
  });

  it('returns false when status is not active', () => {
    expect(isOverdue({ ...base, status: 'expired', payment_day: 1 }, new Set())).toBe(false);
  });
});

describe('isExpired', () => {
  it('returns true for past end_date', () => {
    expect(isExpired({ ...base, end_date: '2020-01-01' })).toBe(true);
  });
  it('returns false for future end_date', () => {
    expect(isExpired({ ...base, end_date: '2099-01-01' })).toBe(false);
  });
  it('returns false when no end_date', () => {
    expect(isExpired({ ...base, end_date: null })).toBe(false);
  });
});

vi.mock('@/lib/supabase/server', () => ({ createServerClient: vi.fn() }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('next/navigation', () => ({ redirect: vi.fn() }));

import { createServerClient } from '@/lib/supabase/server';
import { createTenancy } from '@/app/actions/tenancies';

const mockInsert = vi.fn();
const mockFrom = vi.fn(() => ({ insert: mockInsert }));
const mockSupabase = {
  auth: { getUser: vi.fn() },
  from: mockFrom,
};

beforeEach(() => {
  vi.clearAllMocks();
  (createServerClient as ReturnType<typeof vi.fn>).mockResolvedValue(mockSupabase);
  mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'owner-1' } } });
  mockInsert.mockResolvedValue({ error: null });
});

describe('createTenancy validation', () => {
  it('requires property_id', async () => {
    const r = await createTenancy({
      property_id: '',
      tenant_id: 'tid',
      start_date: '2026-01-01',
      end_date: '',
      monthly_rent: '500',
      deposit: '',
      payment_day: '1',
      status: 'active',
    });
    expect(r?.error).toBe('Property is required');
  });
  it('requires monthly_rent', async () => {
    const r = await createTenancy({
      property_id: 'pid',
      tenant_id: 'tid',
      start_date: '2026-01-01',
      end_date: '',
      monthly_rent: '',
      deposit: '',
      payment_day: '1',
      status: 'active',
    });
    expect(r?.error).toBe('Monthly rent is required');
  });
});
