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

type PropertyRow = { id: string };

type TenancyRow = {
  id: string;
  property_id: string;
  monthly_rent: number;
  payment_day: number;
  end_date: string | null;
  status: 'active' | 'expired' | 'terminated' | null;
};

type TransactionRow = {
  id: string;
  type: string;
  amount: number;
  category: string | null;
  date: string;
};

function rows<T>(data: T[] | null): T[] {
  return data ?? [];
}

/** Normalises a date to local midnight so day-difference math is DST-safe. */
function atLocalMidnight(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

const MS_PER_DAY = 1000 * 60 * 60 * 24;

export function useDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error('Not authenticated');

      const today = atLocalMidnight(new Date());
      const currentDay = today.getDate();
      const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      const monthStartKey = monthStart.toISOString().split('T')[0];

      const in60DaysDate = atLocalMidnight(new Date(today));
      in60DaysDate.setDate(today.getDate() + 60);

      // owner_id scoping is defensive in addition to RLS.
      const [propertiesRes, tenanciesRes, transactionsRes, rentTxRes] = await Promise.all([
        supabase.from('properties').select('id').eq('owner_id', user.id),
        supabase
          .from('tenancies')
          .select('id, property_id, monthly_rent, payment_day, end_date, status')
          .eq('owner_id', user.id),
        supabase
          .from('transactions')
          .select('id, type, amount, category, date')
          .eq('owner_id', user.id)
          .order('date', { ascending: false })
          .limit(5),
        // Rent payments this month, used to exclude paid tenancies from overdue.
        supabase
          .from('transactions')
          .select('tenancy_id')
          .eq('owner_id', user.id)
          .eq('type', 'income')
          .eq('category', 'rent')
          .gte('date', monthStartKey),
      ]);

      const firstError =
        propertiesRes.error || tenanciesRes.error || transactionsRes.error || rentTxRes.error;
      if (firstError) throw firstError;

      const properties = rows<PropertyRow>(propertiesRes.data);
      const tenancies = rows<TenancyRow>(tenanciesRes.data);
      const activeTenancies = tenancies.filter((t) => t.status === 'active');

      const paidTenancyIds = new Set<string>(
        rows<{ tenancy_id: string | null }>(rentTxRes.data)
          .map((r) => r.tenancy_id)
          .filter((id): id is string => Boolean(id)),
      );

      const monthlyIncomeCents = activeTenancies.reduce((sum, t) => sum + (t.monthly_rent ?? 0), 0);
      const occupancyRate =
        properties.length > 0 ? Math.round((activeTenancies.length / properties.length) * 100) : 0;

      // Overdue: active tenancies past their payment day that have NOT paid this month.
      const overdueAlerts = activeTenancies
        .filter((t) => {
          const effectiveDay = Math.min(t.payment_day, lastDayOfMonth);
          return effectiveDay < currentDay && !paidTenancyIds.has(t.id);
        })
        .map((t) => ({
          tenancy_id: t.id,
          payment_day: t.payment_day,
          daysOverdue: currentDay - Math.min(t.payment_day, lastDayOfMonth),
        }));

      // Expiry: active tenancies expiring within 60 days.
      const expiryAlerts = activeTenancies
        .filter((t) => {
          if (!t.end_date) return false;
          const end = atLocalMidnight(new Date(t.end_date));
          return end >= today && end <= in60DaysDate;
        })
        .map((t) => {
          const end = atLocalMidnight(new Date(t.end_date as string));
          return {
            tenancy_id: t.id,
            end_date: t.end_date as string,
            daysLeft: Math.round((end.getTime() - today.getTime()) / MS_PER_DAY),
          };
        });

      const recentTransactions = rows<TransactionRow>(transactionsRes.data).map((t) => ({
        id: t.id,
        type: t.type,
        amount: t.amount,
        category: t.category,
        date: t.date,
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
      // Supabase surfaces errors as objects with a `message` field, not Error instances.
      const message =
        e instanceof Error
          ? e.message
          : typeof e === 'object' && e !== null && 'message' in e
            ? String((e as { message: unknown }).message)
            : 'Failed to load dashboard';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, loading, error, refresh };
}
