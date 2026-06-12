import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export type DashboardData = {
  totalProperties: number;
  activeTenancyCount: number;
  monthlyIncomeCents: number;
  occupancyRate: number;
  overdueAlerts: { tenancy_id: string; payment_day: number; daysOverdue: number }[];
  expiryAlerts: { tenancy_id: string; end_date: string; daysLeft: number }[];
  recentTransactions: { id: string; type: string; amount: number; category: string | null; date: string }[];
};

function rows<T>(data: T[] | null): T[] { return data ?? []; }

export function useDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const today = new Date();
      const currentDay = today.getDate();
      const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();

      const in60DaysDate = new Date(today);
      in60DaysDate.setDate(today.getDate() + 60);

      const [
        { data: propertiesData },
        { data: tenanciesData },
        { data: transactionsData },
      ] = await Promise.all([
        supabase.from('properties').select('id'),
        supabase.from('tenancies').select('id, property_id, monthly_rent, payment_day, end_date, is_active'),
        supabase.from('transactions').select('id, type, amount, category, date').order('date', { ascending: false }).limit(5),
      ]);

      const properties = rows(propertiesData);
      const tenancies = rows(tenanciesData);
      const activeTenancies = tenancies.filter(t => (t as { is_active: boolean }).is_active);

      const monthlyIncomeCents = activeTenancies.reduce((sum, t) => sum + ((t as { monthly_rent: number }).monthly_rent ?? 0), 0);
      const occupancyRate = properties.length > 0 ? Math.round((activeTenancies.length / properties.length) * 100) : 0;

      // Overdue: active tenancies where payment_day < today (simplified)
      const overdueAlerts = activeTenancies
        .filter(t => {
          const effectiveDay = Math.min((t as { payment_day: number }).payment_day, lastDayOfMonth);
          return effectiveDay < currentDay;
        })
        .map(t => ({
          tenancy_id: (t as { id: string }).id,
          payment_day: (t as { payment_day: number }).payment_day,
          daysOverdue: currentDay - Math.min((t as { payment_day: number }).payment_day, lastDayOfMonth),
        }));

      // Expiry: active tenancies expiring within 60 days
      const expiryAlerts = activeTenancies
        .filter(t => {
          const endDate = (t as { end_date: string | null }).end_date;
          if (!endDate) return false;
          const end = new Date(endDate);
          return end >= today && end <= in60DaysDate;
        })
        .map(t => ({
          tenancy_id: (t as { id: string }).id,
          end_date: (t as { end_date: string }).end_date,
          daysLeft: Math.ceil((new Date((t as { end_date: string }).end_date).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)),
        }));

      const recentTransactions = rows(transactionsData).map(t => ({
        id: (t as { id: string }).id,
        type: (t as { type: string }).type,
        amount: (t as { amount: number }).amount,
        category: (t as { category: string | null }).category,
        date: (t as { date: string }).date,
      }));

      setData({
        totalProperties: properties.length,
        activeTenancyCount: activeTenancies.length,
        monthlyIncomeCents,
        occupancyRate,
        overdueAlerts,
        expiryAlerts,
        recentTransactions,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, loading, error, refresh };
}
