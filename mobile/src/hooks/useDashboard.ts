import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { Alert, DashboardData, DashboardStats, Transaction } from '@/types';

function rows<T>(data: T[] | null): T[] {
  return data ?? [];
}

type ActiveTenancyRow = {
  id: string;
  property_id: string;
  monthly_rent: number;
  payment_day: number;
  tenant_id: string;
};

type ExpiringTenancyRow = {
  id: string;
  property_id: string;
  end_date: string | null;
  tenant_id: string;
};

type MonthTxRow = {
  tenancy_id: string | null;
  date: string;
};

type UseDashboardResult = {
  data: DashboardData | null;
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
};

export function useDashboard(): UseDashboardResult {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      const in60Days = new Date(today.getTime() + 60 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];
      const currentMonthStart = `${todayStr.substring(0, 7)}-01`;

      const [propertiesRes, tenanciesRes, transactionsRes, expiringRes, monthTxRes] =
        await Promise.all([
          supabase
            .from('properties')
            .select('id', { count: 'exact', head: true })
            .eq('status', 'owned'),
          supabase
            .from('tenancies')
            .select('id, property_id, monthly_rent, payment_day, tenant_id')
            .eq('status', 'active'),
          supabase
            .from('transactions')
            .select('id, property_id, type, category, amount, date, description')
            .order('date', { ascending: false })
            .limit(5),
          supabase
            .from('tenancies')
            .select('id, property_id, end_date, tenant_id')
            .eq('status', 'active')
            .gte('end_date', todayStr)
            .lte('end_date', in60Days),
          supabase
            .from('transactions')
            .select('tenancy_id, date')
            .eq('type', 'income')
            .eq('category', 'rent')
            .gte('date', currentMonthStart)
            .lte('date', todayStr),
        ]);

      if (propertiesRes.error) throw new Error(propertiesRes.error.message);
      if (tenanciesRes.error) throw new Error(tenanciesRes.error.message);
      if (transactionsRes.error) throw new Error(transactionsRes.error.message);
      if (expiringRes.error) throw new Error(expiringRes.error.message);
      if (monthTxRes.error) throw new Error(monthTxRes.error.message);

      const totalProperties = propertiesRes.count ?? 0;
      const activeTenancyRows = rows<ActiveTenancyRow>(tenanciesRes.data as ActiveTenancyRow[] | null);
      const activeTenancies = activeTenancyRows.length;
      const monthlyIncome = activeTenancyRows.reduce((sum, t) => sum + t.monthly_rent, 0);
      const occupancyRate =
        totalProperties > 0
          ? Math.min(100, Math.round((activeTenancies / totalProperties) * 100))
          : 0;

      const stats: DashboardStats = {
        totalProperties,
        activeTenancies,
        monthlyIncome,
        occupancyRate,
      };

      const paidTenancyIds = new Set(
        rows<MonthTxRow>(monthTxRes.data as MonthTxRow[] | null)
          .map((tx) => tx.tenancy_id)
          .filter((id): id is string => id !== null),
      );
      const currentDay = today.getDate();
      const overdueAlerts: Alert[] = activeTenancyRows
        .filter((t) => t.payment_day <= currentDay && !paidTenancyIds.has(t.id))
        .map((t) => ({
          id: `overdue-${t.id}`,
          type: 'overdue_payment' as const,
          message: 'Rent overdue',
          tenancyId: t.id,
        }));

      const expiringAlerts: Alert[] = rows<ExpiringTenancyRow>(expiringRes.data as ExpiringTenancyRow[] | null).map(
        (t) => ({
          id: `expiring-${t.id}`,
          type: 'lease_expiring' as const,
          message: `Lease expiring ${t.end_date}`,
          tenancyId: t.id,
        }),
      );

      const recentTransactions = rows<Transaction>(transactionsRes.data as Transaction[] | null);

      setData({
        stats,
        alerts: [...overdueAlerts, ...expiringAlerts],
        recentTransactions,
      });
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load dashboard'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refresh: fetchData };
}
