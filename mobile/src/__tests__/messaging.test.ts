import { describe, it, expect } from 'vitest';

function formatWhatsAppUrl(number: string): string {
  const digits = number.replace(/\D/g, '');
  return `https://wa.me/${digits}`;
}

function calcUnreadCount(messages: { direction: string; is_read: boolean }[]): number {
  return messages.filter(m => m.direction === 'inbound' && !m.is_read).length;
}

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
      { direction: 'inbound', is_read: false },
      { direction: 'inbound', is_read: true },
      { direction: 'outbound', is_read: false },
    ];
    expect(calcUnreadCount(msgs)).toBe(1);
  });
});
