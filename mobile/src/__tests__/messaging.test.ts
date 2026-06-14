import { describe, it, expect } from 'vitest';
import {
  formatWhatsAppUrl,
  calcUnreadCount,
  buildTenantsWithStats,
  type MessageRow,
} from '../lib/messaging';

describe('formatWhatsAppUrl', () => {
  it('formats E164 number', () => {
    expect(formatWhatsAppUrl('+359 88 123 4567')).toBe('https://wa.me/359881234567');
  });
  it('handles already clean number', () => {
    expect(formatWhatsAppUrl('35988123457')).toBe('https://wa.me/35988123457');
  });
});

describe('calcUnreadCount', () => {
  it('counts unread inbound only', () => {
    const msgs = [
      { direction: 'inbound', read: false },
      { direction: 'inbound', read: true },
      { direction: 'outbound', read: false },
    ];
    expect(calcUnreadCount(msgs)).toBe(1);
  });
});

describe('buildTenantsWithStats', () => {
  const tenants = [
    { id: 't1', name: 'Alice' },
    { id: 't2', name: 'Bob' },
    { id: 't3', name: 'Carol' },
  ];

  const messages: MessageRow[] = [
    { tenant_id: 't1', body: 'first', direction: 'inbound', read: true, created_at: '2026-01-01T10:00:00Z' },
    { tenant_id: 't1', body: 'newest', direction: 'inbound', read: false, created_at: '2026-01-02T10:00:00Z' },
    { tenant_id: 't2', body: 'hello bob', direction: 'inbound', read: false, created_at: '2026-01-03T09:00:00Z' },
    { tenant_id: 't2', body: 'reply', direction: 'outbound', read: true, created_at: '2026-01-03T09:30:00Z' },
  ];

  it('derives last message (latest by order) per tenant', () => {
    const result = buildTenantsWithStats(tenants, messages);
    const byId = Object.fromEntries(result.map((r) => [r.id, r]));
    expect(byId.t1.lastMessage).toBe('newest');
    expect(byId.t1.lastDate).toBe('2026-01-02');
    expect(byId.t2.lastMessage).toBe('reply');
  });

  it('counts only unread inbound messages per tenant', () => {
    const byId = Object.fromEntries(buildTenantsWithStats(tenants, messages).map((r) => [r.id, r]));
    expect(byId.t1.unreadCount).toBe(1);
    expect(byId.t2.unreadCount).toBe(1);
    expect(byId.t3.unreadCount).toBe(0);
  });

  it('returns tenants with no messages and zero unread', () => {
    const byId = Object.fromEntries(buildTenantsWithStats(tenants, messages).map((r) => [r.id, r]));
    expect(byId.t3.lastMessage).toBeUndefined();
    expect(byId.t3.unreadCount).toBe(0);
  });

  it('preserves tenant order', () => {
    expect(buildTenantsWithStats(tenants, messages).map((r) => r.name)).toEqual(['Alice', 'Bob', 'Carol']);
  });
});
