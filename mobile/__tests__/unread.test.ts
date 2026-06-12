import { describe, it, expect } from 'vitest'
import { countUnreadForTenant, countTotalUnread } from '../lib/unread'
import type { Message } from '../types'

function makeMessage(overrides: Partial<Message> = {}): Message {
  return {
    id: '00000000-0000-0000-0000-000000000001',
    owner_id: 'owner-1',
    tenant_id: 'tenant-1',
    direction: 'inbound',
    channel: 'inapp',
    body: 'Hello',
    read: false,
    created_at: '2024-01-01T00:00:00Z',
    ...overrides,
  }
}

describe('countUnreadForTenant', () => {
  it('counts unread inbound messages for a specific tenant', () => {
    const messages: Message[] = [
      makeMessage({ id: '1', tenant_id: 'tenant-1', direction: 'inbound', read: false }),
      makeMessage({ id: '2', tenant_id: 'tenant-1', direction: 'inbound', read: true }),
      makeMessage({ id: '3', tenant_id: 'tenant-2', direction: 'inbound', read: false }),
      makeMessage({ id: '4', tenant_id: 'tenant-1', direction: 'outbound', read: false }),
    ]
    expect(countUnreadForTenant(messages, 'tenant-1')).toBe(1)
  })

  it('returns 0 when all messages are read', () => {
    const messages: Message[] = [
      makeMessage({ id: '1', read: true }),
      makeMessage({ id: '2', read: true }),
    ]
    expect(countUnreadForTenant(messages, 'tenant-1')).toBe(0)
  })

  it('does not count outbound messages as unread', () => {
    const messages: Message[] = [
      makeMessage({ id: '1', direction: 'outbound', read: false }),
    ]
    expect(countUnreadForTenant(messages, 'tenant-1')).toBe(0)
  })

  it('returns 0 for empty messages array', () => {
    expect(countUnreadForTenant([], 'tenant-1')).toBe(0)
  })

  it('ignores messages belonging to other tenants', () => {
    const messages: Message[] = [
      makeMessage({ id: '1', tenant_id: 'tenant-2', read: false }),
      makeMessage({ id: '2', tenant_id: 'tenant-3', read: false }),
    ]
    expect(countUnreadForTenant(messages, 'tenant-1')).toBe(0)
  })

  it('counts multiple unread messages for the same tenant', () => {
    const messages: Message[] = [
      makeMessage({ id: '1', tenant_id: 'tenant-1', direction: 'inbound', read: false }),
      makeMessage({ id: '2', tenant_id: 'tenant-1', direction: 'inbound', read: false }),
      makeMessage({ id: '3', tenant_id: 'tenant-1', direction: 'inbound', read: false }),
    ]
    expect(countUnreadForTenant(messages, 'tenant-1')).toBe(3)
  })
})

describe('countTotalUnread', () => {
  it('counts all unread inbound messages across all tenants', () => {
    const messages: Message[] = [
      makeMessage({ id: '1', tenant_id: 'tenant-1', direction: 'inbound', read: false }),
      makeMessage({ id: '2', tenant_id: 'tenant-2', direction: 'inbound', read: false }),
      makeMessage({ id: '3', tenant_id: 'tenant-1', direction: 'inbound', read: true }),
      makeMessage({ id: '4', tenant_id: 'tenant-1', direction: 'outbound', read: false }),
    ]
    expect(countTotalUnread(messages)).toBe(2)
  })

  it('returns 0 with empty messages', () => {
    expect(countTotalUnread([])).toBe(0)
  })

  it('returns 0 when all messages are read or outbound', () => {
    const messages: Message[] = [
      makeMessage({ id: '1', direction: 'inbound', read: true }),
      makeMessage({ id: '2', direction: 'outbound', read: false }),
    ]
    expect(countTotalUnread(messages)).toBe(0)
  })

  it('counts unread messages from multiple different tenants', () => {
    const messages: Message[] = [
      makeMessage({ id: '1', tenant_id: 'tenant-1', direction: 'inbound', read: false }),
      makeMessage({ id: '2', tenant_id: 'tenant-2', direction: 'inbound', read: false }),
      makeMessage({ id: '3', tenant_id: 'tenant-3', direction: 'inbound', read: false }),
    ]
    expect(countTotalUnread(messages)).toBe(3)
  })
})
