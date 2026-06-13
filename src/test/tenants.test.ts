import { describe, it, expect, vi, beforeEach } from 'vitest';
vi.mock('@/lib/supabase/server', () => ({ createServerClient: vi.fn() }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('next/navigation', () => ({ redirect: vi.fn() }));
import { createServerClient } from '@/lib/supabase/server';
import { createTenant, updateTenant, deleteTenant } from '@/app/actions/tenants';

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

  // eq: supports multi-eq chaining; the object is also thenable so await works
  const makeThenable = (value: unknown) =>
    Object.assign(Object.create(null), chain, {
      then: (resolve: (v: unknown) => void) => Promise.resolve(value).then(resolve),
    });

  chain.eq = vi.fn().mockImplementation(() => {
    if (results.updateError !== undefined) {
      return makeThenable({ error: results.updateError });
    }
    return makeThenable(terminal);
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

describe('updateTenant', () => {
  it('returns error for empty name', async () => {
    const result = await updateTenant('t-1', {
      name: '  ',
      egn: '',
      phone: '',
      email: '',
      whatsapp: '',
      notes: '',
    });
    expect(result?.error).toBe('Name is required');
  });

  it('returns error when not authenticated', async () => {
    mockDb.auth.getUser.mockResolvedValue({ data: { user: null } });
    const result = await updateTenant('t-1', {
      name: 'Alice',
      egn: '',
      phone: '',
      email: '',
      whatsapp: '',
      notes: '',
    });
    expect(result?.error).toBe('Not authenticated');
  });

  it('returns error on Supabase failure', async () => {
    const chain = buildChain({ updateError: { message: 'Update failed' } });
    mockDb.from.mockReturnValue(chain);
    const result = await updateTenant('t-1', {
      name: 'Alice',
      egn: '',
      phone: '',
      email: '',
      whatsapp: '',
      notes: '',
    });
    expect(result?.error).toBe('Update failed');
  });

  it('calls update with trimmed name and correct id', async () => {
    const chain = buildChain();
    mockDb.from.mockReturnValue(chain);
    await updateTenant('t-1', {
      name: '  Bob  ',
      egn: '',
      phone: '',
      email: '',
      whatsapp: '',
      notes: '',
    }).catch(() => {});
    expect(chain.update).toHaveBeenCalledWith(expect.objectContaining({ name: 'Bob' }));
    expect(chain.eq).toHaveBeenCalledWith('id', 't-1');
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
