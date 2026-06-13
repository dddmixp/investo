import { describe, it, expect, vi, beforeEach } from 'vitest';
import { validateLoginForm, submitLogin } from '../lib/loginForm';

describe('validateLoginForm', () => {
  it('rejects when email is empty', () => {
    const result = validateLoginForm('', 'pw');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('Email and password are required.');
  });

  it('rejects when password is empty', () => {
    const result = validateLoginForm('a@b.com', '');
    expect(result.ok).toBe(false);
  });

  it('rejects whitespace-only email', () => {
    const result = validateLoginForm('   ', 'pw');
    expect(result.ok).toBe(false);
  });

  it('trims the email on success', () => {
    const result = validateLoginForm('  user@example.com  ', 'secret');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.email).toBe('user@example.com');
      expect(result.password).toBe('secret');
    }
  });
});

describe('submitLogin', () => {
  const signInWithPassword = vi.fn();
  const client = { auth: { signInWithPassword } } as never;

  beforeEach(() => {
    signInWithPassword.mockReset();
  });

  it('does not call supabase when validation fails', async () => {
    const result = await submitLogin(client, '', 'pw');
    expect(result.ok).toBe(false);
    expect(result.error).toBe('Email and password are required.');
    expect(signInWithPassword).not.toHaveBeenCalled();
  });

  it('calls signInWithPassword with a trimmed email on valid input', async () => {
    signInWithPassword.mockResolvedValue({ error: null });
    const result = await submitLogin(client, '  user@example.com ', 'secret');
    expect(result.ok).toBe(true);
    expect(signInWithPassword).toHaveBeenCalledWith({
      email: 'user@example.com',
      password: 'secret',
    });
  });

  it('surfaces the supabase error message on failure', async () => {
    signInWithPassword.mockResolvedValue({ error: { message: 'Invalid login credentials' } });
    const result = await submitLogin(client, 'user@example.com', 'wrong');
    expect(result.ok).toBe(false);
    expect(result.error).toBe('Invalid login credentials');
  });
});

describe('LoginScreen module', () => {
  it('exports a default component', async () => {
    vi.doMock('../lib/supabase', () => ({ supabase: { auth: { signInWithPassword: vi.fn() } } }));
    vi.doMock('react-native', () => ({
      View: 'View',
      Text: 'Text',
      TextInput: 'TextInput',
      TouchableOpacity: 'TouchableOpacity',
      ActivityIndicator: 'ActivityIndicator',
      KeyboardAvoidingView: 'KeyboardAvoidingView',
      Platform: { OS: 'ios' },
    }));
    const mod = await import('../screens/LoginScreen');
    expect(typeof mod.default).toBe('function');
  });
});
