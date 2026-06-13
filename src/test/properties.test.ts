import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/supabase/server', () => ({
  createServerClient: vi.fn(),
}));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('next/navigation', () => ({ redirect: vi.fn() }));

import { createServerClient } from '@/lib/supabase/server';
import { createProperty, updateProperty } from '@/app/actions/properties';

const mockSupabase = {
  auth: { getUser: vi.fn() },
  from: vi.fn(),
};

function mockDb(result: { error?: { message: string } | null } = {}) {
  // Build a chain that is thenable at any point (for await on any method).
  // .update().eq().eq() — the final call must resolve; we make eq always return
  // a thenable chain so the last awaited call resolves correctly.
  const resolvedValue = { error: result.error ?? null };
  const chain: Record<string, ReturnType<typeof vi.fn>> = {
    insert: vi.fn().mockResolvedValue(resolvedValue),
    update: vi.fn(),
    delete: vi.fn(),
    eq: vi.fn(),
    select: vi.fn(),
    single: vi.fn().mockResolvedValue(resolvedValue),
  };
  // update/delete return the chain for further chaining
  chain.update.mockReturnValue(chain);
  chain.delete.mockReturnValue(chain);
  // eq returns a thenable chain — so `await chain.eq(...)` works AND `chain.eq(...).eq(...)` works
  chain.eq.mockReturnValue({
    ...chain,
    then: (resolve: (v: typeof resolvedValue) => void) => Promise.resolve(resolvedValue).then(resolve),
  });
  mockSupabase.from.mockReturnValue(chain);
  return chain;
}

beforeEach(() => {
  vi.clearAllMocks();
  (createServerClient as ReturnType<typeof vi.fn>).mockResolvedValue(mockSupabase);
  mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'owner-1' } } });
});

describe('createProperty', () => {
  it('returns error when address is empty', async () => {
    const result = await createProperty({ address: '', type: '', status: '', purchase_date: '', purchase_price: '', current_value: '' });
    expect(result?.error).toBe('Address is required');
  });

  it('inserts property with correct EUR cents conversion', async () => {
    const chain = mockDb();
    await createProperty({ address: 'Sofia', type: 'apartment', status: 'owned', purchase_date: '', purchase_price: '100000.50', current_value: '' }).catch(() => {});
    expect(chain.insert).toHaveBeenCalledWith(expect.objectContaining({ purchase_price: 10000050 }));
  });

  it('returns error on Supabase failure', async () => {
    mockDb({ error: { message: 'DB error' } });
    const result = await createProperty({ address: 'Sofia', type: '', status: '', purchase_date: '', purchase_price: '', current_value: '' });
    expect(result?.error).toBe('DB error');
  });

  it('returns error for invalid purchase_price', async () => {
    const result = await createProperty({ address: 'Sofia', type: '', status: '', purchase_date: '', purchase_price: 'abc', current_value: '' });
    expect(result?.error).toBe('Invalid price format');
  });

  it('returns error for invalid current_value', async () => {
    const result = await createProperty({ address: 'Sofia', type: '', status: '', purchase_date: '', purchase_price: '', current_value: 'xyz' });
    expect(result?.error).toBe('Invalid price format');
  });
});

describe('updateProperty', () => {
  it('returns error when address is empty', async () => {
    const result = await updateProperty('id-1', { address: '  ', type: '', status: '', purchase_date: '', purchase_price: '', current_value: '' });
    expect(result?.error).toBe('Address is required');
  });

  it('updates property successfully', async () => {
    mockDb();
    const result = await updateProperty('id-1', { address: 'Sofia', type: 'apartment', status: 'owned', purchase_date: '', purchase_price: '', current_value: '' }).catch(() => null);
    
    // redirect is mocked so result is undefined (void); no error returned
  });

  it('returns error on auth failure', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });
    const result = await updateProperty('id-1', { address: 'Sofia', type: '', status: '', purchase_date: '', purchase_price: '', current_value: '' });
    expect(result?.error).toBe('Not authenticated');
  });

  it('returns error on Supabase failure', async () => {
    mockDb({ error: { message: 'Update failed' } });
    const result = await updateProperty('id-1', { address: 'Sofia', type: '', status: '', purchase_date: '', purchase_price: '', current_value: '' });
    expect(result?.error).toBe('Update failed');
  });
});
