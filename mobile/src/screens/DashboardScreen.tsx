import React from 'react';
import { View, Text, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { useDashboard } from '@/hooks/useDashboard';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { formatEUR } from '@/lib/format';

export function DashboardScreen() {
  const { data, loading, error, refresh } = useDashboard();
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  if (loading && !data) {
    return (
      <View className="flex-1 items-center justify-center" testID="dashboard-loading">
        <ActivityIndicator size="large" testID="loading-indicator" />
      </View>
    );
  }

  if (error && !data) {
    return (
      <View className="flex-1 items-center justify-center" testID="dashboard-error">
        <Text className="text-base text-red-600">Failed to load dashboard</Text>
      </View>
    );
  }

  const { stats, alerts, recentTransactions } = data!;

  return (
    <ScrollView
      className="flex-1 bg-gray-50"
      testID="dashboard-scroll"
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} testID="refresh-control" />
      }
    >
      {error && (
        <View className="mx-4 mt-3 p-3 bg-red-50 rounded-lg" testID="refresh-error-banner">
          <Text className="text-sm text-red-600">Refresh failed — showing cached data</Text>
        </View>
      )}

      <Text className="text-xl font-bold text-gray-900 px-4 pt-5 pb-3">Portfolio Overview</Text>

      <View className="px-3 mb-2" testID="stats-grid">
        <View className="flex-row mb-1">
          <StatsCard label="Properties" value={stats.totalProperties} testID="stat-properties" />
          <StatsCard
            label="Active Tenancies"
            value={stats.activeTenancies}
            testID="stat-tenancies"
          />
        </View>
        <View className="flex-row mb-1">
          <StatsCard
            label="Monthly Income"
            value={formatEUR(stats.monthlyIncome)}
            testID="stat-income"
          />
          <StatsCard
            label="Occupancy"
            value={`${stats.occupancyRate}%`}
            testID="stat-occupancy"
          />
        </View>
      </View>

      {alerts.length > 0 && (
        <View className="mx-4 mb-6" testID="alerts-section">
          <Text className="text-base font-semibold text-gray-700 mb-2">Alerts</Text>
          {alerts.map((alert) => (
            <View
              key={alert.id}
              className={`flex-row items-center p-3 rounded-lg mb-1.5 ${
                alert.type === 'overdue_payment' ? 'bg-red-50' : 'bg-amber-50'
              }`}
              testID={`alert-${alert.id}`}
            >
              <Text className="text-lg mr-2.5">
                {alert.type === 'overdue_payment' ? '⚠' : '📅'}
              </Text>
              <Text className="text-sm text-gray-700 flex-1">{alert.message}</Text>
            </View>
          ))}
        </View>
      )}

      <View className="mx-4 mb-6" testID="transactions-section">
        <Text className="text-base font-semibold text-gray-700 mb-2">Recent Transactions</Text>
        {recentTransactions.length === 0 ? (
          <Text className="text-sm text-gray-400 text-center py-4" testID="transactions-empty">
            No transactions yet
          </Text>
        ) : (
          recentTransactions.map((tx) => (
            <View
              key={tx.id}
              className="flex-row justify-between items-center bg-white p-3 rounded-lg mb-1.5"
              testID={`transaction-${tx.id}`}
            >
              <View className="flex-1">
                <Text className="text-sm font-medium text-gray-900 capitalize">
                  {tx.category}
                </Text>
                <Text className="text-xs text-gray-500 mt-0.5">{tx.date}</Text>
              </View>
              <Text
                className={`text-base font-semibold ${
                  tx.type === 'income' ? 'text-emerald-600' : 'text-red-600'
                }`}
              >
                {tx.type === 'income' ? '+' : '-'}
                {formatEUR(tx.amount)}
              </Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}
