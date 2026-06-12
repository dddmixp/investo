import type { Message } from '../types'

export function countUnreadForTenant(messages: Message[], tenantId: string): number {
  return messages.filter(
    (m) => m.tenant_id === tenantId && m.direction === 'inbound' && !m.read
  ).length
}

export function countTotalUnread(messages: Message[]): number {
  return messages.filter((m) => m.direction === 'inbound' && !m.read).length
}
