export function calcBookingTotal(
  checkIn: string,
  checkOut: string,
  nightlyRate: number,
  cleaningFee: number | null,
): number {
  const nights = Math.ceil(
    (new Date(checkOut).getTime() - new Date(checkIn).getTime()) /
      (1000 * 60 * 60 * 24),
  );
  return nights * nightlyRate + (cleaningFee ?? 0);
}

export function hasOverlap(
  newCheckIn: string,
  newCheckOut: string,
  propertyId: string,
  existing: Array<{
    check_in: string;
    check_out: string;
    property_id: string;
    status: string;
    id?: string;
  }>,
  excludeId?: string,
): boolean {
  const newIn = new Date(newCheckIn).getTime();
  const newOut = new Date(newCheckOut).getTime();
  return existing.some((b) => {
    if (b.id === excludeId) return false;
    if (b.property_id !== propertyId) return false;
    if (b.status === 'cancelled' || b.status === 'checked_out') return false;
    const bIn = new Date(b.check_in).getTime();
    const bOut = new Date(b.check_out).getTime();
    return newIn < bOut && newOut > bIn;
  });
}
