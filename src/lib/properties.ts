/**
 * Calculate the percentage appreciation between a property's purchase price and
 * its current value.
 *
 * Both prices are integer EUR cents. Returns the appreciation as a string
 * rounded to one decimal place (e.g. "20.0"), or null when either value is
 * missing.
 */
export function calcAppreciation(
  purchasePrice: number | null,
  currentValue: number | null,
): string | null {
  if (purchasePrice == null || currentValue == null) return null;
  if (purchasePrice === 0) return null;
  return (((currentValue - purchasePrice) / purchasePrice) * 100).toFixed(1);
}
