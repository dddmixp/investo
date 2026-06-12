import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { LoginScreen } from '../screens/LoginScreen';

const mockSignIn = jest.fn();

jest.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: (...args: unknown[]) => mockSignIn(...args),
    },
  },
}));

beforeEach(() => {
  jest.clearAllMocks();
});

describe('LoginScreen', () => {
  it('renders email and password inputs', () => {
    render(<LoginScreen />);
    expect(screen.getByTestId('input-email')).toBeTruthy();
    expect(screen.getByTestId('input-password')).toBeTruthy();
  });

  it('shows validation error when submitting with empty fields', async () => {
    render(<LoginScreen />);
    fireEvent.press(screen.getByTestId('login-button'));
    await waitFor(() =>
      expect(screen.getByTestId('login-error')).toBeTruthy(),
    );
    expect(screen.getByText('Email and password are required')).toBeTruthy();
    expect(mockSignIn).not.toHaveBeenCalled();
  });

  it('shows validation error when password is missing', async () => {
    render(<LoginScreen />);
    fireEvent.changeText(screen.getByTestId('input-email'), 'test@example.com');
    fireEvent.press(screen.getByTestId('login-button'));
    await waitFor(() => expect(screen.getByTestId('login-error')).toBeTruthy());
    expect(mockSignIn).not.toHaveBeenCalled();
  });

  it('calls signInWithPassword with entered credentials', async () => {
    mockSignIn.mockResolvedValue({ error: null });
    render(<LoginScreen />);
    fireEvent.changeText(screen.getByTestId('input-email'), 'owner@investo.com');
    fireEvent.changeText(screen.getByTestId('input-password'), 'secret');
    fireEvent.press(screen.getByTestId('login-button'));
    await waitFor(() => expect(mockSignIn).toHaveBeenCalledTimes(1));
    expect(mockSignIn).toHaveBeenCalledWith({
      email: 'owner@investo.com',
      password: 'secret',
    });
  });

  it('shows Supabase error message on failed login', async () => {
    mockSignIn.mockResolvedValue({ error: { message: 'Invalid credentials' } });
    render(<LoginScreen />);
    fireEvent.changeText(screen.getByTestId('input-email'), 'bad@example.com');
    fireEvent.changeText(screen.getByTestId('input-password'), 'wrong');
    fireEvent.press(screen.getByTestId('login-button'));
    await waitFor(() => expect(screen.getByTestId('login-error')).toBeTruthy());
    expect(screen.getByText('Invalid credentials')).toBeTruthy();
  });

  it('button re-enables after login completes', async () => {
    mockSignIn.mockResolvedValue({ error: null });
    render(<LoginScreen />);
    fireEvent.changeText(screen.getByTestId('input-email'), 'owner@investo.com');
    fireEvent.changeText(screen.getByTestId('input-password'), 'secret');
    fireEvent.press(screen.getByTestId('login-button'));
    await waitFor(() => expect(mockSignIn).toHaveBeenCalled());
    expect(screen.getByTestId('login-button').props.accessibilityState?.disabled).toBeFalsy();
  });
});
