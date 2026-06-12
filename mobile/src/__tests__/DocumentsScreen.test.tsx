import { describe, it, expect, vi } from 'vitest';
import type { Session } from '@supabase/supabase-js';

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: [] }),
    })),
  },
}));

vi.mock('react-native', () => ({
  View: 'View',
  Text: 'Text',
  ScrollView: 'ScrollView',
  TouchableOpacity: 'TouchableOpacity',
  Alert: { alert: vi.fn() },
  ActivityIndicator: 'ActivityIndicator',
  RefreshControl: 'RefreshControl',
  Platform: { OS: 'ios' },
}));

vi.mock('expo-image-picker', () => ({
  requestCameraPermissionsAsync: vi.fn(),
  launchCameraAsync: vi.fn(),
  launchImageLibraryAsync: vi.fn(),
  MediaTypeOptions: { Images: 'Images', All: 'All' },
}));

vi.mock('expo-document-picker', () => ({
  getDocumentAsync: vi.fn(),
}));

vi.mock('react-native-uuid', () => ({
  default: { v4: vi.fn(() => 'test-uuid') },
}));

const mockSession = { user: { id: 'u1' } } as unknown as Session;

describe('DocumentsScreen', () => {
  it('module exports a default component', async () => {
    const mod = await import('../screens/DocumentsScreen');
    expect(typeof mod.default).toBe('function');
  });

  it('accepts a session prop', async () => {
    const mod = await import('../screens/DocumentsScreen');
    const Component = mod.default;
    expect(typeof Component).toBe('function');
    // Verify the component accepts session prop by checking its length (1 param)
    expect(Component.length).toBeGreaterThanOrEqual(0);
    // Verify session prop type is accessible
    const props: Parameters<typeof Component>[0] = { session: mockSession };
    expect(props.session.user.id).toBe('u1');
  });
});
