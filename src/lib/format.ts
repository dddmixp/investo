/**
 * Format an integer number of EUR cents as a human-readable EUR string.
 * e.g. 150000 → "€1,500.00"
 */
export function formatEUR(cents: number): string {
  const euros = cents / 100;
  return new Intl.NumberFormat('en-IE', {
    style: 'currency',
    currency: 'EUR',
  }).format(euros);
}
