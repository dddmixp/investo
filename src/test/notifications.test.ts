import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/supabase/server', () => ({ createServerClient: vi.fn() }));
vi.mock('@/lib/dashboard', () => ({
  getOverdueAlerts: vi.fn().mockReturnValue([]),
}));

import { createServerClient } from '@/lib/supabase/server';
import { sendOverdueNotifications } from '@/app/actions/notifications';

const mockSupabase = {
  auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }) },
  from: vi.fn(),
};

beforeEach(() => {
  vi.clearAllMocks();
  (createServerClient as ReturnType<typeof vi.fn>).mockResolvedValue(mockSupabase);
  mockSupabase.from.mockReturnValue({
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null }),
    insert: vi.fn().mockResolvedValue({ error: null }),
    upsert: vi.fn().mockResolvedValue({ error: null }),
  });
});

describe('sendOverdueNotifications', () => {
  it('returns 0 when no alerts', async () => {
    const result = await sendOverdueNotifications();
    expect(result.sent).toBe(0);
  });
});
