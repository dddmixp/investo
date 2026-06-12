/**
 * Calculate the next monthly payment date for a loan.
 *
 * Returns the next payment date (ISO string YYYY-MM-DD) on or after today,
 * based on the loan's start date anniversary. Returns null if the loan has
 * expired (term_months exceeded) or if inputs are invalid.
 */
export function nextPaymentDate(
  startDate: string,
  termMonths: number | null,
): string | null {
  const start = new Date(startDate);
  if (isNaN(start.getTime())) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Build a candidate: same day-of-month as start, in the current or next month
  const candidate = new Date(
    today.getFullYear(),
    today.getMonth(),
    start.getDate(),
  );
  if (candidate < today) {
    candidate.setMonth(candidate.getMonth() + 1);
  }

  // Check if loan has already ended
  if (termMonths !== null) {
    const end = new Date(start);
    end.setMonth(end.getMonth() + termMonths);
    if (candidate > end) return null;
  }

  // Format as YYYY-MM-DD
  const y = candidate.getFullYear();
  const m = String(candidate.getMonth() + 1).padStart(2, '0');
  const d = String(candidate.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
