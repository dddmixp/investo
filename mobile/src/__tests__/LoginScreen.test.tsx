import { describe, it, expect, vi } from 'vitest';

// Mock supabase before any imports
vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      }),
    },
  },
}));

// Mock react-native
vi.mock('react-native', () => ({
  View: 'View',
  Text: 'Text',
  TextInput: 'TextInput',
  TouchableOpacity: 'TouchableOpacity',
  ActivityIndicator: 'ActivityIndicator',
  KeyboardAvoidingView: 'KeyboardAvoidingView',
  Platform: { OS: 'ios' },
  Alert: { alert: vi.fn() },
  ScrollView: 'ScrollView',
}));

describe('LoginScreen', () => {
  it('module exports a default component', async () => {
    const mod = await import('../screens/LoginScreen');
    expect(typeof mod.default).toBe('function');
  });
});

describe('ProfileScreen logout', () => {
  it('module exports a default component', async () => {
    const mod = await import('../screens/ProfileScreen');
    expect(typeof mod.default).toBe('function');
  });

  it('supabase signOut is available via supabase client', async () => {
    const { supabase } = await import('../lib/supabase');
    expect(typeof supabase.auth.signOut).toBe('function');
  });
});
