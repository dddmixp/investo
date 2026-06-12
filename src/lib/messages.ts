import type { Message } from '@/types'

export function buildWhatsAppUrl(whatsapp: string): string {
  // wa.me requires the international number without the leading +
  const number = whatsapp.replace(/[\s\-()]/g, '').replace(/^\+/, '').replace(/^00/, '')
  return `https://wa.me/${number}`
}

export function buildTelUrl(phone: string): string {
  return `tel:${phone}`
}

export function buildMailtoUrl(email: string): string {
  return `mailto:${email}`
}

export function getUnreadCount(messages: Message[]): number {
  return messages.filter((m) => !m.read && m.direction === 'inbound').length
}
