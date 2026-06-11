import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { DashboardScreen } from '../screens/DashboardScreen';
import * as useDashboardModule from '../hooks/useDashboard';
import type { DashboardData } from '../types';

jest.mock('../lib/supabase', () => ({ supabase: {} }));
jest.mock('../hooks/useDashboard', () => ({ useDashboard: jest.fn() }));

const mockRefresh = jest.fn().mockResolvedValue(undefined);

const mockData: DashboardData = {
  stats: {
    totalProperties: 3,
    activeTenancies: 2,
    monthlyIncome: 150000,
    occupancyRate: 67,
  },
  alerts: [
    {
      id: 'overdue-abc',
      type: 'overdue_payment',
      message: 'Rent overdue',
      tenancyId: 'abc',
    },
    {
      id: 'expiring-def',
      type: 'lease_expiring',
      message: 'Lease expiring 2026-07-31',
      tenancyId: 'def',
    },
  ],
  recentTransactions: [
    {
      id: 'tx-1',
      property_id: 'prop-1',
      type: 'income',
      category: 'rent',
      amount: 75000,
      date: '2026-06-01',
      description: null,
    },
    {
      id: 'tx-2',
      property_id: 'prop-1',
      type: 'expense',
      category: 'maintenance',
      amount: 12000,
      date: '2026-05-28',
      description: null,
    },
  ],
};

function mockDashboard(overrides?: Partial<ReturnType<typeof useDashboardModule.useDashboard>>) {
  (useDashboardModule.useDashboard as jest.Mock).mockReturnValue({
    data: mockData,
    loading: false,
    error: null,
    refresh: mockRefresh,
    ...overrides,
  });
}

describe('DashboardScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows loading indicator while data is loading', () => {
    mockDashboard({ data: null, loading: true });
    render(<DashboardScreen />);
    expect(screen.getByTestId('loading-indicator')).toBeTruthy();
  });

  it('shows error message when fetch fails and no data exists', () => {
    mockDashboard({ data: null, loading: false, error: new Error('Network error') });
    render(<DashboardScreen />);
    expect(screen.getByTestId('dashboard-error')).toBeTruthy();
  });

  it('renders all four stats cards with data', () => {
    mockDashboard();
    render(<DashboardScreen />);

    expect(screen.getByTestId('stat-properties')).toBeTruthy();
    expect(screen.getByTestId('stat-tenancies')).toBeTruthy();
    expect(screen.getByTestId('stat-income')).toBeTruthy();
    expect(screen.getByTestId('stat-occupancy')).toBeTruthy();
  });

  it('displays correct stat values', () => {
    mockDashboard();
    render(<DashboardScreen />);

    expect(screen.getByText('3')).toBeTruthy();
    expect(screen.getByText('2')).toBeTruthy();
    expect(screen.getByText('67%')).toBeTruthy();
  });

  it('renders alerts section when alerts exist', () => {
    mockDashboard();
    render(<DashboardScreen />);

    expect(screen.getByTestId('alerts-section')).toBeTruthy();
    expect(screen.getByTestId('alert-overdue-abc')).toBeTruthy();
    expect(screen.getByTestId('alert-expiring-def')).toBeTruthy();
    expect(screen.getByText('Rent overdue')).toBeTruthy();
    expect(screen.getByText('Lease expiring 2026-07-31')).toBeTruthy();
  });

  it('does not render alerts section when there are no alerts', () => {
    mockDashboard({ data: { ...mockData, alerts: [] } });
    render(<DashboardScreen />);

    expect(screen.queryByTestId('alerts-section')).toBeNull();
  });

  it('renders recent transactions', () => {
    mockDashboard();
    render(<DashboardScreen />);

    expect(screen.getByTestId('transactions-section')).toBeTruthy();
    expect(screen.getByTestId('transaction-tx-1')).toBeTruthy();
    expect(screen.getByTestId('transaction-tx-2')).toBeTruthy();
  });

  it('shows empty state when there are no transactions', () => {
    mockDashboard({ data: { ...mockData, recentTransactions: [] } });
    render(<DashboardScreen />);

    expect(screen.getByTestId('transactions-empty')).toBeTruthy();
    expect(screen.getByText('No transactions yet')).toBeTruthy();
  });

  it('triggers refresh when pull-to-refresh is activated', async () => {
    mockDashboard();
    render(<DashboardScreen />);

    const scrollView = screen.getByTestId('dashboard-scroll');
    const { onRefresh } = scrollView.props.refreshControl.props as {
      onRefresh: () => Promise<void>;
    };

    await act(async () => {
      await onRefresh();
    });

    expect(mockRefresh).toHaveBeenCalledTimes(1);
  });
});
