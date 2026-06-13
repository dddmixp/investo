import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/supabase/server', () => ({ createServerClient: vi.fn() }));
vi.mock('@/lib/dashboard', () => ({
  getOverdueAlerts: vi.fn().mockReturnValue([]),
}));
vi.mock('@/lib/push', () => ({
  sendExpoPush: vi.fn().mockResolvedValue(true),
  isExpoPushToken: vi.fn().mockReturnValue(true),
}));

import { createServerClient } from '@/lib/supabase/server';
import { getOverdueAlerts } from '@/lib/dashboard';
import { sendExpoPush } from '@/lib/push';
import { sendOverdueNotifications } from '@/app/actions/notifications';

const insertMock = vi.fn().mockResolvedValue({ error: null });

// Per-table mock data resolved by the query-builder's awaited result.
let tableData: Record<string, unknown[]>;

function makeSupabase() {
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }),
    },
    from: vi.fn((table: string) => {
      // Chainable builder: every filter returns the builder; awaiting it
      // resolves to this table's configured rows.
      const builder: Record<string, unknown> = {};
      const self = () => builder;
      builder.select = vi.fn(self);
      builder.eq = vi.fn(self);
      builder.gte = vi.fn(self);
      builder.in = vi.fn(self);
      builder.insert = insertMock;
      (builder as { then: unknown }).then = (
        resolve: (v: { data: unknown[] }) => void,
      ) => resolve({ data: tableData[table] ?? [] });
      return builder;
    }),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  tableData = {
    tenancies: [],
    transactions: [],
    push_tokens: [],
    sent_notifications: [],
  };
  (getOverdueAlerts as ReturnType<typeof vi.fn>).mockReturnValue([]);
  (sendExpoPush as ReturnType<typeof vi.fn>).mockResolvedValue(true);
  (createServerClient as ReturnType<typeof vi.fn>).mockResolvedValue(
    makeSupabase(),
  );
});

describe('sendOverdueNotifications', () => {
  it('returns 0 when no alerts', async () => {
    const result = await sendOverdueNotifications();
    expect(result.sent).toBe(0);
    expect(sendExpoPush).not.toHaveBeenCalled();
  });

  it('sends a push per alert/token and returns the sent count', async () => {
    tableData.push_tokens = [
      { token: 'ExponentPushToken[abc]' },
      { token: 'ExponentPushToken[def]' },
    ];
    (getOverdueAlerts as ReturnType<typeof vi.fn>).mockReturnValue([
      { tenancy_id: 't1', daysOverdue: 3 },
      { tenancy_id: 't2', daysOverdue: 5 },
    ]);

    const result = await sendOverdueNotifications();

    // Two alerts, each sent to two tokens => 4 sends, 2 dedup inserts.
    expect(result.sent).toBe(2);
    expect(sendExpoPush).toHaveBeenCalledTimes(4);
    expect(insertMock).toHaveBeenCalledTimes(2);
  });

  it('skips alerts already sent today', async () => {
    const dateKey = new Date().toISOString().split('T')[0];
    tableData.push_tokens = [{ token: 'ExponentPushToken[abc]' }];
    tableData.sent_notifications = [
      { notification_key: `overdue:t1:${dateKey}` },
    ];
    (getOverdueAlerts as ReturnType<typeof vi.fn>).mockReturnValue([
      { tenancy_id: 't1', daysOverdue: 3 },
    ]);

    const result = await sendOverdueNotifications();

    expect(result.sent).toBe(0);
    expect(sendExpoPush).not.toHaveBeenCalled();
  });
});
