export function formatEUR(cents: number): string {
  return new Intl.NumberFormat('bg-BG', { style: 'currency', currency: 'EUR' }).format(cents / 100);
}
