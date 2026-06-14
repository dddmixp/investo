export type TenantRow = { id: string; name: string };

export type MessageRow = {
  tenant_id: string;
  body: string;
  direction: 'inbound' | 'outbound';
  read: boolean;
  created_at: string;
};

export type TenantWithUnread = {
  id: string;
  name: string;
  lastMessage?: string;
  lastDate?: string;
  unreadCount: number;
};

/** Build the WhatsApp deep-link for a phone number (digits only). */
export function formatWhatsAppUrl(number: string): string {
  const digits = number.replace(/\D/g, '');
  return `https://wa.me/${digits}`;
}

/** Count unread inbound messages in a flat list. */
export function calcUnreadCount(messages: { direction: string; read: boolean }[]): number {
  return messages.filter((m) => m.direction === 'inbound' && !m.read).length;
}

/**
 * Derive per-tenant last-message + unread-count from a single batched query of
 * all messages for the given tenants. `messages` MUST be ordered by created_at
 * ascending so the last entry per tenant is the most recent. This replaces the
 * previous N+1 (two queries per tenant) with in-memory aggregation.
 */
export function buildTenantsWithStats(
  tenants: TenantRow[],
  messages: MessageRow[]
): TenantWithUnread[] {
  const lastByTenant = new Map<string, MessageRow>();
  const unreadByTenant = new Map<string, number>();

  for (const m of messages) {
    // messages ordered ascending → later entries overwrite, leaving the latest.
    lastByTenant.set(m.tenant_id, m);
    if (m.direction === 'inbound' && !m.read) {
      unreadByTenant.set(m.tenant_id, (unreadByTenant.get(m.tenant_id) ?? 0) + 1);
    }
  }

  return tenants.map((t) => {
    const last = lastByTenant.get(t.id);
    return {
      id: t.id,
      name: t.name,
      lastMessage: last?.body ?? undefined,
      lastDate: last?.created_at?.split('T')[0] ?? undefined,
      unreadCount: unreadByTenant.get(t.id) ?? 0,
    };
  });
}
