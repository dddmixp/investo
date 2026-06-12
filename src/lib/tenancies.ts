import type { Tenancy } from '@/types';

export function isOverdue(tenancy: Tenancy, paidTenancyIds: Set<string>): boolean {
  if (tenancy.status !== 'active') return false;
  const today = new Date();
  const currentDay = today.getDate();
  const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const effectiveDay = Math.min(tenancy.payment_day, lastDayOfMonth);
  return effectiveDay < currentDay && !paidTenancyIds.has(tenancy.id);
}

export function isExpired(tenancy: Tenancy): boolean {
  if (!tenancy.end_date) return false;
  return new Date(tenancy.end_date) < new Date();
}
