import { describe, it, expect, vi, beforeEach } from 'vitest';
vi.mock('@/lib/supabase/server', () => ({ createServerClient: vi.fn() }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('next/navigation', () => ({ redirect: vi.fn() }));
import { createServerClient } from '@/lib/supabase/server';
import { createTenant, deleteTenant } from '@/app/actions/tenants';

const mockUser = { id: 'owner-1' };
let mockDb: { from: ReturnType<typeof vi.fn>; auth: { getUser: ReturnType<typeof vi.fn> } };

function buildChain(results: Record<string, unknown> = {}) {
  const terminal = {
    error: results.deleteError ?? null,
    count: results.count ?? 0,
  };
  const chain: Record<string, unknown> = {};
  // All chainable methods return chain by default
  ['select', 'insert', 'update', 'delete', 'single'].forEach((m) => {
    chain[m] = vi.fn(() => chain);
  });
  chain.insert = vi.fn().mockResolvedValue({ error: results.insertError ?? null });
  Object.assign(chain, { count: results.count ?? 0 });

  // eq: first call returns chain (so second eq can be called), second call returns terminal
  let eqCallCount = 0;
  chain.eq = vi.fn().mockImplementation(() => {
    eqCallCount++;
    if (eqCallCount < 2) return chain;
    eqCallCount = 0;
    return terminal;
  });
  return chain;
}

beforeEach(() => {
  vi.clearAllMocks();
  mockDb = {
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: mockUser } }) },
    from: vi.fn(),
  };
  (createServerClient as ReturnType<typeof vi.fn>).mockResolvedValue(mockDb);
});

describe('createTenant', () => {
  it('returns error for empty name', async () => {
    expect(
      (
        await createTenant({
          name: '',
          egn: '',
          phone: '',
          email: '',
          whatsapp: '',
          notes: '',
        })
      )?.error,
    ).toBe('Name is required');
  });
  it('calls insert with trimmed name', async () => {
    const chain = buildChain();
    mockDb.from.mockReturnValue(chain);
    await createTenant({
      name: '  Alice  ',
      egn: '',
      phone: '',
      email: '',
      whatsapp: '',
      notes: '',
    }).catch(() => {});
    expect(chain.insert).toHaveBeenCalledWith(expect.objectContaining({ name: 'Alice' }));
  });
});

describe('deleteTenant', () => {
  it('blocks delete when active tenancies exist', async () => {
    const chain = buildChain({ count: 2 });
    mockDb.from.mockReturnValue(chain);
    const result = await deleteTenant('t-1');
    expect(result?.error).toContain('active tenancies');
  });
});
