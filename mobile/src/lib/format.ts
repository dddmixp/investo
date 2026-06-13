/** Formats an integer amount of EUR cents as a localised currency string. */
export function formatEUR(cents: number): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
  }).format(cents / 100);
}
