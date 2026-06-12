import { describe, expect, it } from 'vitest'
import { getUnreadCount } from '@/lib/messages'
import type { Message } from '@/types'

function makeMessage(overrides: Partial<Message>): Message {
  return {
    id: '1',
    owner_id: 'owner-1',
    created_at: '2024-01-01T00:00:00Z',
    tenant_id: 'tenant-1',
    direction: 'inbound',
    channel: 'inapp',
    body: 'hello',
    read: false,
    ...overrides,
  }
}

describe('getUnreadCount', () => {
  it('returns 0 for empty array', () => {
    expect(getUnreadCount([])).toBe(0)
  })

  it('counts a single unread inbound message', () => {
    expect(getUnreadCount([makeMessage({ direction: 'inbound', read: false })])).toBe(1)
  })

  it('does not count read inbound messages', () => {
    expect(getUnreadCount([makeMessage({ direction: 'inbound', read: true })])).toBe(0)
  })

  it('does not count outbound messages regardless of read status', () => {
    const messages = [
      makeMessage({ direction: 'outbound', read: false }),
      makeMessage({ direction: 'outbound', read: true }),
    ]
    expect(getUnreadCount(messages)).toBe(0)
  })

  it('counts only unread inbound in a mixed list', () => {
    const messages = [
      makeMessage({ id: '1', direction: 'inbound', read: false }),
      makeMessage({ id: '2', direction: 'inbound', read: true }),
      makeMessage({ id: '3', direction: 'outbound', read: false }),
      makeMessage({ id: '4', direction: 'inbound', read: false }),
    ]
    expect(getUnreadCount(messages)).toBe(2)
  })

  it('counts multiple unread inbound messages', () => {
    const messages = [
      makeMessage({ id: '1', direction: 'inbound', read: false }),
      makeMessage({ id: '2', direction: 'inbound', read: false }),
      makeMessage({ id: '3', direction: 'inbound', read: false }),
    ]
    expect(getUnreadCount(messages)).toBe(3)
  })
})
