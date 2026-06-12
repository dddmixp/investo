import { describe, it, expect } from 'vitest';
import { getOverdueAlerts, getExpiryAlerts } from '@/lib/dashboard';

describe('getOverdueAlerts', () => {
  const tenancies = [
    { id: 't1', property_id: 'p1', payment_day: 5, is_active: true, tenant_name: 'Alice' },
    { id: 't2', property_id: 'p1', payment_day: 25, is_active: true, tenant_name: 'Bob' },
    { id: 't3', property_id: 'p2', payment_day: 1, is_active: false, tenant_name: 'Charlie' },
  ];

  it('returns overdue active tenancies past payment day', () => {
    const today = new Date('2026-06-15');
    const alerts = getOverdueAlerts(tenancies, new Set(), today);
    expect(alerts.map((a) => a.tenancy_id)).toContain('t1');
    expect(alerts.map((a) => a.tenancy_id)).not.toContain('t2'); // payment_day 25 not yet passed
    expect(alerts.map((a) => a.tenancy_id)).not.toContain('t3'); // inactive
  });

  it('excludes paid tenancies', () => {
    const today = new Date('2026-06-15');
    const alerts = getOverdueAlerts(tenancies, new Set(['t1']), today);
    expect(alerts.map((a) => a.tenancy_id)).not.toContain('t1');
  });

  it('calculates daysOverdue correctly', () => {
    const today = new Date('2026-06-15');
    const alerts = getOverdueAlerts(tenancies, new Set(), today);
    const t1Alert = alerts.find((a) => a.tenancy_id === 't1');
    expect(t1Alert?.daysOverdue).toBe(10); // 15 - 5
  });

  it('handles payment_day beyond last day of month', () => {
    const tenanciesWithLateDay = [
      { id: 't4', property_id: 'p1', payment_day: 31, is_active: true, tenant_name: 'Dave' },
    ];
    // February 2026 has 28 days; day 31 clamps to 28; today is March 1 → overdue
    const today = new Date('2026-03-01');
    // month = March, lastDay = 31, effectiveDay = min(31,31) = 31, currentDay = 1 → NOT overdue
    const alerts = getOverdueAlerts(tenanciesWithLateDay, new Set(), today);
    expect(alerts).toHaveLength(0);
  });

  it('returns empty array when no active tenancies', () => {
    const today = new Date('2026-06-15');
    const alerts = getOverdueAlerts(
      [{ id: 't3', property_id: 'p2', payment_day: 1, is_active: false, tenant_name: 'Charlie' }],
      new Set(),
      today,
    );
    expect(alerts).toHaveLength(0);
  });

  it('uses Unknown for missing tenant_name', () => {
    const today = new Date('2026-06-15');
    const t = [{ id: 'tx', property_id: 'px', payment_day: 1, is_active: true, tenant_name: null }];
    const alerts = getOverdueAlerts(t, new Set(), today);
    expect(alerts[0].tenant_name).toBe('Unknown');
  });
});

describe('getExpiryAlerts', () => {
  it('includes tenancies expiring within 60 days', () => {
    const today = new Date('2026-06-15');
    const tenancies = [
      { id: 't1', property_id: 'p1', end_date: '2026-07-30', is_active: true, tenant_name: 'Alice' },
      { id: 't2', property_id: 'p1', end_date: '2026-09-30', is_active: true, tenant_name: 'Bob' }, // >60 days
    ];
    const alerts = getExpiryAlerts(tenancies, today);
    expect(alerts.map((a) => a.tenancy_id)).toContain('t1');
    expect(alerts.map((a) => a.tenancy_id)).not.toContain('t2');
  });

  it('excludes inactive tenancies', () => {
    const today = new Date('2026-06-15');
    const tenancies = [
      { id: 't1', property_id: 'p1', end_date: '2026-07-01', is_active: false, tenant_name: 'Alice' },
    ];
    const alerts = getExpiryAlerts(tenancies, today);
    expect(alerts).toHaveLength(0);
  });

  it('excludes tenancies with no end_date', () => {
    const today = new Date('2026-06-15');
    const tenancies = [
      { id: 't1', property_id: 'p1', end_date: null, is_active: true, tenant_name: 'Alice' },
    ];
    const alerts = getExpiryAlerts(tenancies, today);
    expect(alerts).toHaveLength(0);
  });

  it('excludes already-expired tenancies', () => {
    const today = new Date('2026-06-15');
    const tenancies = [
      { id: 't1', property_id: 'p1', end_date: '2026-06-01', is_active: true, tenant_name: 'Alice' },
    ];
    const alerts = getExpiryAlerts(tenancies, today);
    expect(alerts).toHaveLength(0);
  });

  it('calculates daysLeft correctly', () => {
    const today = new Date('2026-06-15');
    const tenancies = [
      { id: 't1', property_id: 'p1', end_date: '2026-07-15', is_active: true, tenant_name: 'Alice' },
    ];
    const alerts = getExpiryAlerts(tenancies, today);
    expect(alerts[0].daysLeft).toBe(30);
  });

  it('respects custom windowDays', () => {
    const today = new Date('2026-06-15');
    const tenancies = [
      { id: 't1', property_id: 'p1', end_date: '2026-07-30', is_active: true, tenant_name: 'Alice' },
    ];
    // 30-day window → t1 (45 days away) should NOT appear
    const alerts = getExpiryAlerts(tenancies, today, 30);
    expect(alerts).toHaveLength(0);
  });
});
