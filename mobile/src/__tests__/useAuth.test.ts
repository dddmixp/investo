import { renderHook, waitFor } from '@testing-library/react-native';
import { useAuth } from '../hooks/useAuth';

const mockGetSession = jest.fn();
const mockOnAuthStateChange = jest.fn();
const mockUnsubscribe = jest.fn();

jest.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      get getSession() { return mockGetSession; },
      get onAuthStateChange() { return mockOnAuthStateChange; },
    },
  },
}));

const fakeSession = { user: { id: 'u1' }, access_token: 'tok' } as never;

function setupAuth({
  session = fakeSession,
  rejects = false,
}: { session?: typeof fakeSession | null; rejects?: boolean } = {}) {
  if (rejects) {
    mockGetSession.mockRejectedValue(new Error('network error'));
  } else {
    mockGetSession.mockResolvedValue({ data: { session } });
  }
  mockOnAuthStateChange.mockReturnValue({
    data: { subscription: { unsubscribe: mockUnsubscribe } },
  });
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('useAuth', () => {
  it('starts with loading=true', () => {
    setupAuth();
    const { result } = renderHook(() => useAuth());
    expect(result.current.loading).toBe(true);
  });

  it('sets session when getSession resolves', async () => {
    setupAuth({ session: fakeSession });
    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.session).toBe(fakeSession);
    expect(result.current.authUnavailable).toBe(false);
  });

  it('sets session to null when not logged in', async () => {
    setupAuth({ session: null });
    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.session).toBeNull();
    expect(result.current.authUnavailable).toBe(false);
  });

  it('sets authUnavailable when getSession rejects', async () => {
    setupAuth({ rejects: true });
    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.authUnavailable).toBe(true);
    expect(result.current.session).toBeNull();
  });

  it('cleans up listener on unmount', async () => {
    setupAuth();
    const { unmount } = renderHook(() => useAuth());
    await waitFor(() => {});
    unmount();
    expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
  });
});
