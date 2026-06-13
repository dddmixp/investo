import React, { useEffect } from 'react';
import { View, Text, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { useDashboard } from '../hooks/useDashboard';
import { formatEUR } from '../lib/format';

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <View className="bg-white rounded-xl border border-gray-200 p-4 flex-1">
      <Text className="text-xs text-gray-500">{label}</Text>
      <Text className="text-lg font-bold text-gray-900 mt-1">{value}</Text>
    </View>
  );
}

export function DashboardScreen() {
  const { data, loading, error, refresh } = useDashboard();

  useEffect(() => { refresh(); }, [refresh]);

  if (loading && !data) {
    return <View className="flex-1 items-center justify-center bg-gray-50"><ActivityIndicator size="large" /></View>;
  }

  return (
    <ScrollView
      className="flex-1 bg-gray-50"
      refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} />}
    >
      <View className="p-4 gap-4">
        <Text className="text-xl font-bold text-gray-900">Dashboard</Text>

        {error && (
          <View className="bg-red-50 border border-red-200 rounded-xl p-3">
            <Text className="text-red-700 text-sm">{error}</Text>
          </View>
        )}

        {/* Stats grid */}
        {data && (
          <>
            <View className="flex-row gap-3">
              <StatCard label="Properties" value={data.totalProperties} />
              <StatCard label="Tenancies" value={data.activeTenancyCount} />
            </View>
            <View className="flex-row gap-3">
              <StatCard label="Monthly Income" value={formatEUR(data.monthlyIncomeCents)} />
              <StatCard label="Occupancy" value={`${data.occupancyRate}%`} />
            </View>

            {/* Overdue alerts */}
            {data.overdueAlerts.length > 0 && (
              <View className="bg-red-50 border border-red-200 rounded-xl p-4">
                <Text className="font-semibold text-red-800 mb-2">Overdue Payments</Text>
                {data.overdueAlerts.map(a => (
                  <Text key={a.tenancy_id} className="text-red-700 text-sm">
                    Payment day {a.payment_day} — {a.daysOverdue} day{a.daysOverdue !== 1 ? 's' : ''} overdue
                  </Text>
                ))}
              </View>
            )}

            {/* Expiry alerts */}
            {data.expiryAlerts.length > 0 && (
              <View className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                <Text className="font-semibold text-yellow-800 mb-2">Leases Expiring Soon</Text>
                {data.expiryAlerts.map(a => (
                  <Text key={a.tenancy_id} className="text-yellow-700 text-sm">
                    Expires {a.end_date} — {a.daysLeft} day{a.daysLeft !== 1 ? 's' : ''} left
                  </Text>
                ))}
              </View>
            )}

            {/* Recent transactions */}
            {data.recentTransactions.length > 0 && (
              <View className="bg-white rounded-xl border border-gray-200 p-4">
                <Text className="font-semibold text-gray-900 mb-3">Recent Transactions</Text>
                {data.recentTransactions.map(t => (
                  <View key={t.id} className="flex-row justify-between py-2 border-b border-gray-50">
                    <View>
                      <Text className="text-sm text-gray-700">{t.category ?? 'Uncategorised'}</Text>
                      <Text className="text-xs text-gray-400">{t.date}</Text>
                    </View>
                    <Text className={`font-medium text-sm ${t.type === 'income' ? 'text-green-700' : 'text-red-700'}`}>
                      {t.type === 'income' ? '+' : '-'}{formatEUR(t.amount)}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </>
        )}
      </View>
    </ScrollView>
  );
}
