/** Format integer euro cents as a EUR currency string. e.g. 150050 -> "€1,500.50" */
export function formatEUR(cents: number): string {
  return new Intl.NumberFormat('en-IE', {
    style: 'currency',
    currency: 'EUR',
  }).format(cents / 100);
}
