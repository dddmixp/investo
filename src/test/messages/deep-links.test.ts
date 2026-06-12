import { describe, expect, it } from 'vitest'
import { buildMailtoUrl, buildTelUrl, buildWhatsAppUrl } from '@/lib/messages'

describe('buildWhatsAppUrl', () => {
  it('strips leading + from E164 number', () => {
    expect(buildWhatsAppUrl('+359888123456')).toBe('https://wa.me/359888123456')
  })

  it('works with number already without +', () => {
    expect(buildWhatsAppUrl('359888123456')).toBe('https://wa.me/359888123456')
  })

  it('constructs correct wa.me URL for UK number', () => {
    expect(buildWhatsAppUrl('+447911123456')).toBe('https://wa.me/447911123456')
  })

  it('constructs correct wa.me URL for BG number', () => {
    expect(buildWhatsAppUrl('+359876543210')).toBe('https://wa.me/359876543210')
  })
})

describe('buildTelUrl', () => {
  it('creates tel: link with E164 number', () => {
    expect(buildTelUrl('+359888123456')).toBe('tel:+359888123456')
  })

  it('preserves local number format', () => {
    expect(buildTelUrl('0888123456')).toBe('tel:0888123456')
  })
})

describe('buildMailtoUrl', () => {
  it('creates mailto: link', () => {
    expect(buildMailtoUrl('tenant@example.com')).toBe('mailto:tenant@example.com')
  })

  it('preserves email address exactly', () => {
    expect(buildMailtoUrl('name+tag@domain.bg')).toBe('mailto:name+tag@domain.bg')
  })
})
