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
  const chain = { insert: vi.fn(), update: vi.fn(), delete: vi.fn(), eq: vi.fn(), select: vi.fn() };
  chain.insert.mockResolvedValue({ error: result.error ?? null });
  chain.update.mockReturnValue(chain);
  chain.delete.mockReturnValue(chain);
  chain.eq.mockResolvedValue({ error: result.error ?? null });
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
});

describe('updateProperty', () => {
  it('returns error when address is empty', async () => {
    const result = await updateProperty('id-1', { address: '  ', type: '', status: '', purchase_date: '', purchase_price: '', current_value: '' });
    expect(result?.error).toBe('Address is required');
  });
});
