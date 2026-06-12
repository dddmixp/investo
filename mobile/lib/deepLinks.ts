export function buildWhatsAppUrl(whatsapp: string): string {
  // wa.me requires the international number without the leading +
  const normalized = whatsapp.replace(/[\s\-()]/g, '').replace(/^\+/, '').replace(/^00/, '')
  return `https://wa.me/${normalized}`
}

export function buildCallUrl(phone: string): string {
  return `tel:${phone}`
}

export function buildEmailUrl(email: string): string {
  return `mailto:${email}`
}
