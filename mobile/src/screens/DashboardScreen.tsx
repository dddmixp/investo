import React from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
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
      <View style={styles.center} testID="dashboard-loading">
        <ActivityIndicator size="large" testID="loading-indicator" />
      </View>
    );
  }

  if (error && !data) {
    return (
      <View style={styles.center} testID="dashboard-error">
        <Text style={styles.errorText}>Failed to load dashboard</Text>
      </View>
    );
  }

  const { stats, alerts, recentTransactions } = data ?? {
    stats: { totalProperties: 0, activeTenancies: 0, monthlyIncome: 0, occupancyRate: 0 },
    alerts: [],
    recentTransactions: [],
  };

  return (
    <ScrollView
      style={styles.container}
      testID="dashboard-scroll"
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          testID="refresh-control"
        />
      }
    >
      <Text style={styles.title}>Portfolio Overview</Text>

      <View style={styles.statsGrid} testID="stats-grid">
        <View style={styles.statsRow}>
          <StatsCard
            label="Properties"
            value={stats.totalProperties}
            testID="stat-properties"
          />
          <StatsCard
            label="Active Tenancies"
            value={stats.activeTenancies}
            testID="stat-tenancies"
          />
        </View>
        <View style={styles.statsRow}>
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
        <View style={styles.section} testID="alerts-section">
          <Text style={styles.sectionTitle}>Alerts</Text>
          {alerts.map((alert) => (
            <View
              key={alert.id}
              style={[styles.alertItem, alert.type === 'overdue_payment' ? styles.alertOverdue : styles.alertExpiring]}
              testID={`alert-${alert.id}`}
            >
              <Text style={styles.alertIcon}>
                {alert.type === 'overdue_payment' ? '⚠' : '📅'}
              </Text>
              <Text style={styles.alertText}>{alert.message}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.section} testID="transactions-section">
        <Text style={styles.sectionTitle}>Recent Transactions</Text>
        {recentTransactions.length === 0 ? (
          <Text style={styles.emptyText} testID="transactions-empty">
            No transactions yet
          </Text>
        ) : (
          recentTransactions.map((tx) => (
            <View key={tx.id} style={styles.transactionItem} testID={`transaction-${tx.id}`}>
              <View style={styles.transactionInfo}>
                <Text style={styles.transactionCategory}>{tx.category}</Text>
                <Text style={styles.transactionDate}>{tx.date}</Text>
              </View>
              <Text
                style={[
                  styles.transactionAmount,
                  tx.type === 'income' ? styles.income : styles.expense,
                ]}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 12,
  },
  statsGrid: {
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  alertItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 6,
  },
  alertOverdue: {
    backgroundColor: '#fef2f2',
  },
  alertExpiring: {
    backgroundColor: '#fffbeb',
  },
  alertIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  alertText: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 6,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionCategory: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    textTransform: 'capitalize',
  },
  transactionDate: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  transactionAmount: {
    fontSize: 15,
    fontWeight: '600',
  },
  income: {
    color: '#059669',
  },
  expense: {
    color: '#dc2626',
  },
  emptyText: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    paddingVertical: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#dc2626',
  },
});
