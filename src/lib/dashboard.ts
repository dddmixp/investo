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
      daysOverdue: currentDay - Math.min(t.payment_day, lastDayOfMonth),
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
  const windowEnd = new Date(today);
  windowEnd.setDate(today.getDate() + windowDays);

  return tenancies
    .filter((t) => t.is_active && t.end_date)
    .filter((t) => {
      const end = new Date(t.end_date!);
      return end >= today && end <= windowEnd;
    })
    .map((t) => ({
      tenancy_id: t.id,
      property_id: t.property_id,
      tenant_name: t.tenant_name ?? 'Unknown',
      end_date: t.end_date!,
      daysLeft: Math.ceil(
        (new Date(t.end_date!).getTime() - today.getTime()) /
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
  const windowEnd = new Date(today);
  windowEnd.setDate(today.getDate() + windowDays);

  return loans
    .filter((l) => l.start_date)
    .map((l) => ({ ...l, next: nextPaymentDateFn(l.start_date!, l.term_months) }))
    .filter((l) => l.next !== null)
    .filter((l) => {
      const d = new Date(l.next!);
      return d >= today && d <= windowEnd;
    })
    .map((l) => ({
      loan_id: l.id,
      property_id: l.property_id,
      lender: l.lender,
      next_payment: l.next!,
      daysLeft: Math.ceil(
        (new Date(l.next!).getTime() - today.getTime()) /
          (1000 * 60 * 60 * 24),
      ),
    }));
}
