import { describe, it, expect } from 'vitest'
import { buildWhatsAppUrl, buildCallUrl, buildEmailUrl } from '../lib/deepLinks'

describe('buildWhatsAppUrl', () => {
  it('passes through E164 number unchanged', () => {
    expect(buildWhatsAppUrl('+359888123456')).toBe('https://wa.me/+359888123456')
  })

  it('strips whitespace', () => {
    expect(buildWhatsAppUrl('+359 888 123 456')).toBe('https://wa.me/+359888123456')
  })

  it('converts 00-prefix to + prefix', () => {
    expect(buildWhatsAppUrl('00359888123456')).toBe('https://wa.me/+359888123456')
  })

  it('strips dashes', () => {
    expect(buildWhatsAppUrl('+359-888-123-456')).toBe('https://wa.me/+359888123456')
  })

  it('strips parentheses', () => {
    expect(buildWhatsAppUrl('+359(888)123456')).toBe('https://wa.me/+359888123456')
  })

  it('handles Bulgarian mobile number with country code', () => {
    expect(buildWhatsAppUrl('+359 87 654 3210')).toBe('https://wa.me/+359876543210')
  })
})

describe('buildCallUrl', () => {
  it('creates tel: deep link', () => {
    expect(buildCallUrl('+359888123456')).toBe('tel:+359888123456')
  })

  it('preserves the phone string as-is', () => {
    expect(buildCallUrl('0888123456')).toBe('tel:0888123456')
  })
})

describe('buildEmailUrl', () => {
  it('creates mailto: deep link', () => {
    expect(buildEmailUrl('tenant@example.com')).toBe('mailto:tenant@example.com')
  })

  it('preserves the email string as-is', () => {
    expect(buildEmailUrl('john.doe+label@domain.bg')).toBe('mailto:john.doe+label@domain.bg')
  })
})
