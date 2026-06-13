import type { Session, SupabaseClient } from '@supabase/supabase-js';

export interface AuthState {
  session: Session | null;
  loading: boolean;
  authUnavailable: boolean;
}

export const initialAuthState: AuthState = {
  session: null,
  loading: true,
  authUnavailable: false,
};

/**
 * Pure state-transition logic for the auth lifecycle, extracted from useAuth so
 * it can be tested without a React renderer.
 *
 * `onChange` is invoked with the next state whenever something happens.
 * Returns an unsubscribe function for the auth-state-change subscription.
 */
export function startAuthController(
  client: Pick<SupabaseClient, 'auth'>,
  onChange: (state: AuthState) => void
): () => void {
  let state: AuthState = { ...initialAuthState };
  let active = true;

  const emit = (patch: Partial<AuthState>) => {
    if (!active) return;
    state = { ...state, ...patch };
    onChange(state);
  };

  client.auth
    .getSession()
    .then(({ data: { session }, error }) => {
      if (error) {
        emit({ authUnavailable: true, loading: false });
      } else {
        emit({ session, loading: false });
      }
    })
    .catch(() => {
      emit({ authUnavailable: true, loading: false });
    });

  const {
    data: { subscription },
  } = client.auth.onAuthStateChange((_event, session) => {
    // A successful auth state change means connectivity has recovered,
    // so clear any previous "service unavailable" error.
    emit({ session, authUnavailable: false });
  });

  return () => {
    active = false;
    subscription.unsubscribe();
  };
}
