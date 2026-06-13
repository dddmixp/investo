export function nextPaymentDate(startDate: string, termMonths: number | null): string | null {
  if (!startDate) return null;
  // Parse YYYY-MM-DD at local noon to avoid UTC-midnight off-by-one near month boundaries.
  const start = new Date(startDate + 'T12:00:00');
  const today = new Date();
  if (termMonths !== null) {
    const end = new Date(start);
    end.setMonth(end.getMonth() + termMonths);
    if (today > end) return null; // loan paid off
  }
  const next = new Date(start);
  while (next <= today) {
    next.setMonth(next.getMonth() + 1);
  }
  return next.toISOString().split('T')[0];
}
