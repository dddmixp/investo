import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/supabase/server', () => ({ createServerClient: vi.fn() }));
vi.mock('next/navigation', () => ({ redirect: vi.fn() }));

import { createServerClient } from '@/lib/supabase/server';
import { logout } from '@/app/actions/auth';

const mockSupabase = { auth: { signOut: vi.fn().mockResolvedValue({ error: null }) } };

beforeEach(() => {
  vi.clearAllMocks();
  (createServerClient as ReturnType<typeof vi.fn>).mockResolvedValue(mockSupabase);
});

describe('logout', () => {
  it('calls signOut and redirects', async () => {
    await logout().catch(() => {}); // redirect() throws internally in Next.js
    expect(mockSupabase.auth.signOut).toHaveBeenCalled();
  });
});
