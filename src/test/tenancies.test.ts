import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
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
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-15T12:00:00'));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns false when rent is already paid', () => {
    expect(isOverdue(base, new Set(['t1']))).toBe(false);
  });

  it('returns true when payment_day is in the past and unpaid', () => {
    expect(isOverdue({ ...base, payment_day: 1 }, new Set())).toBe(true);
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
import { createTenancy, updateTenancy, deleteTenancy } from '@/app/actions/tenancies';

const mockInsert = vi.fn();
// update().eq().eq() and delete().eq().eq() resolve to { error }
const mockUpdateResult = { error: null as null | { message: string } };
const mockDeleteResult = { error: null as null | { message: string } };
const mockUpdate = vi.fn(() => ({
  eq: vi.fn(() => ({ eq: vi.fn(() => Promise.resolve(mockUpdateResult)) })),
}));
const mockDelete = vi.fn(() => ({
  eq: vi.fn(() => ({ eq: vi.fn(() => Promise.resolve(mockDeleteResult)) })),
}));
const mockFrom = vi.fn(() => ({
  insert: mockInsert,
  update: mockUpdate,
  delete: mockDelete,
}));
const mockSupabase = {
  auth: { getUser: vi.fn() },
  from: mockFrom,
};

const validData = {
  property_id: 'pid',
  tenant_id: 'tid',
  start_date: '2026-01-01',
  end_date: '',
  monthly_rent: '500',
  deposit: '',
  payment_day: '1',
  status: 'active',
};

beforeEach(() => {
  vi.clearAllMocks();
  (createServerClient as ReturnType<typeof vi.fn>).mockResolvedValue(mockSupabase);
  mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'owner-1' } } });
  mockInsert.mockResolvedValue({ error: null });
  mockUpdateResult.error = null;
  mockDeleteResult.error = null;
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
  it('rejects invalid status', async () => {
    const r = await createTenancy({ ...validData, status: 'bogus' });
    expect(r?.error).toBe('Invalid status');
  });
});

describe('updateTenancy', () => {
  it('updates when authenticated', async () => {
    await updateTenancy('ten-1', validData);
    expect(mockUpdate).toHaveBeenCalled();
  });
  it('returns error when not authenticated', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });
    const r = await updateTenancy('ten-1', validData);
    expect(r?.error).toBe('Not authenticated');
    expect(mockUpdate).not.toHaveBeenCalled();
  });
  it('returns db error message', async () => {
    mockUpdateResult.error = { message: 'db failed' };
    const r = await updateTenancy('ten-1', validData);
    expect(r?.error).toBe('db failed');
  });
});

describe('deleteTenancy', () => {
  it('deletes when authenticated', async () => {
    const r = await deleteTenancy('ten-1');
    expect(r).toBeNull();
    expect(mockDelete).toHaveBeenCalled();
  });
  it('returns error when not authenticated', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });
    const r = await deleteTenancy('ten-1');
    expect(r?.error).toBe('Not authenticated');
    expect(mockDelete).not.toHaveBeenCalled();
  });
  it('returns db error message', async () => {
    mockDeleteResult.error = { message: 'delete failed' };
    const r = await deleteTenancy('ten-1');
    expect(r?.error).toBe('delete failed');
  });
});
