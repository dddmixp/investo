export function buildWhatsAppUrl(whatsapp: string): string {
  const e164 = whatsapp.replace(/[\s\-()]/g, '').replace(/^00/, '+')
  return `https://wa.me/${e164}`
}

export function buildCallUrl(phone: string): string {
  return `tel:${phone}`
}

export function buildEmailUrl(email: string): string {
  return `mailto:${email}`
}
