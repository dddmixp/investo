export type OverdueAlert = {
  tenancy_id: string;
  property_id: string;
  tenant_name: string;
  payment_day: number;
  daysOverdue: number;
};

export type ExpiryAlert = {
  tenancy_id: string;
  property_id: string;
  tenant_name: string;
  end_date: string;
  daysLeft: number;
};

export type LoanPaymentAlert = {
  loan_id: string;
  property_id: string;
  lender: string;
  next_payment: string;
  daysLeft: number;
};

/**
 * Parse a YYYY-MM-DD date string at local midnight.
 *
 * `new Date('2026-07-30')` is interpreted as UTC midnight, which can shift the
 * calendar day relative to a locally-constructed `today`. Parsing the parts
 * explicitly keeps both sides in the local timezone so day comparisons stay
 * consistent.
 */
function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

/** Return a copy of `date` normalized to local midnight. */
function startOfDay(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export function getOverdueAlerts(
  tenancies: Array<{
    id: string;
    property_id: string;
    payment_day: number;
    is_active: boolean;
    tenant_name?: string | null;
  }>,
  paidTenancyIds: Set<string>,
  today: Date = new Date(),
): OverdueAlert[] {
  const currentDay = today.getDate();
  const lastDayOfMonth = new Date(
    today.getFullYear(),
    today.getMonth() + 1,
    0,
  ).getDate();

  return tenancies
    .filter((t) => t.is_active)
    .filter((t) => {
      const effectiveDay = Math.min(t.payment_day, lastDayOfMonth);
      return effectiveDay < currentDay && !paidTenancyIds.has(t.id);
    })
    .map((t) => ({
      tenancy_id: t.id,
      property_id: t.property_id,
      tenant_name: t.tenant_name ?? 'Unknown',
      payment_day: t.payment_day,
      daysOverdue:
        currentDay - Math.min(t.payment_day, lastDayOfMonth),
    }));
}

export function getExpiryAlerts(
  tenancies: Array<{
    id: string;
    property_id: string;
    end_date: string | null;
    is_active: boolean;
    tenant_name?: string | null;
  }>,
  today: Date = new Date(),
  windowDays = 60,
): ExpiryAlert[] {
  const todayStart = startOfDay(today);
  const windowEnd = new Date(todayStart);
  windowEnd.setDate(todayStart.getDate() + windowDays);

  return tenancies
    .filter((t) => t.is_active && t.end_date)
    .filter((t) => {
      const end = parseLocalDate(t.end_date!);
      return end >= todayStart && end <= windowEnd;
    })
    .map((t) => ({
      tenancy_id: t.id,
      property_id: t.property_id,
      tenant_name: t.tenant_name ?? 'Unknown',
      end_date: t.end_date!,
      daysLeft: Math.round(
        (parseLocalDate(t.end_date!).getTime() - todayStart.getTime()) /
          (1000 * 60 * 60 * 24),
      ),
    }));
}

export function getLoanPaymentAlerts(
  loans: Array<{
    id: string;
    property_id: string;
    lender: string;
    start_date: string | null;
    term_months: number | null;
  }>,
  nextPaymentDateFn: (
    startDate: string,
    termMonths: number | null,
  ) => string | null,
  today: Date = new Date(),
  windowDays = 7,
): LoanPaymentAlert[] {
  const todayStart = startOfDay(today);
  const windowEnd = new Date(todayStart);
  windowEnd.setDate(todayStart.getDate() + windowDays);

  return loans
    .filter((l) => l.start_date)
    .map((l) => ({ ...l, next: nextPaymentDateFn(l.start_date!, l.term_months) }))
    .filter((l) => l.next !== null)
    .filter((l) => {
      const d = parseLocalDate(l.next!);
      return d >= todayStart && d <= windowEnd;
    })
    .map((l) => ({
      loan_id: l.id,
      property_id: l.property_id,
      lender: l.lender,
      next_payment: l.next!,
      daysLeft: Math.round(
        (parseLocalDate(l.next!).getTime() - todayStart.getTime()) /
          (1000 * 60 * 60 * 24),
      ),
    }));
}
