import { describe, it, expect, vi } from 'vitest';
import { startAuthController, initialAuthState, type AuthState } from '../hooks/authController';

type AuthChangeHandler = (event: string, session: unknown) => void;

function makeClient(opts: {
  getSession?: () => Promise<{ data: { session: unknown }; error: unknown }>;
}) {
  let handler: AuthChangeHandler = () => {};
  const unsubscribe = vi.fn();
  const client = {
    auth: {
      getSession:
        opts.getSession ??
        (() => Promise.resolve({ data: { session: null }, error: null })),
      onAuthStateChange: (cb: AuthChangeHandler) => {
        handler = cb;
        return { data: { subscription: { unsubscribe } } };
      },
    },
  };
  return { client, fire: (s: unknown) => handler('SIGNED_IN', s), unsubscribe };
}

describe('startAuthController', () => {
  it('exposes the loading initial state', () => {
    expect(initialAuthState).toEqual({ session: null, loading: true, authUnavailable: false });
  });

  it('sets the session and clears loading when getSession succeeds', async () => {
    const session = { user: { id: 'u1' } };
    const states: AuthState[] = [];
    const { client } = makeClient({
      getSession: () => Promise.resolve({ data: { session }, error: null }),
    });
    startAuthController(client as never, (s) => states.push(s));
    await vi.waitFor(() => expect(states.length).toBeGreaterThan(0));
    const last = states[states.length - 1];
    expect(last.session).toBe(session);
    expect(last.loading).toBe(false);
    expect(last.authUnavailable).toBe(false);
  });

  it('sets authUnavailable when getSession returns an error', async () => {
    const states: AuthState[] = [];
    const { client } = makeClient({
      getSession: () =>
        Promise.resolve({ data: { session: null }, error: { message: 'boom' } }),
    });
    startAuthController(client as never, (s) => states.push(s));
    await vi.waitFor(() => expect(states.length).toBeGreaterThan(0));
    const last = states[states.length - 1];
    expect(last.authUnavailable).toBe(true);
    expect(last.loading).toBe(false);
  });

  it('sets authUnavailable when getSession rejects', async () => {
    const states: AuthState[] = [];
    const { client } = makeClient({
      getSession: () => Promise.reject(new Error('network down')),
    });
    startAuthController(client as never, (s) => states.push(s));
    await vi.waitFor(() => expect(states.length).toBeGreaterThan(0));
    expect(states[states.length - 1].authUnavailable).toBe(true);
  });

  it('clears authUnavailable on a later auth state change (connectivity recovery)', async () => {
    const states: AuthState[] = [];
    const { client, fire } = makeClient({
      getSession: () =>
        Promise.resolve({ data: { session: null }, error: { message: 'boom' } }),
    });
    startAuthController(client as never, (s) => states.push(s));
    await vi.waitFor(() => expect(states[states.length - 1].authUnavailable).toBe(true));

    const recovered = { user: { id: 'u2' } };
    fire(recovered);

    const last = states[states.length - 1];
    expect(last.authUnavailable).toBe(false);
    expect(last.session).toBe(recovered);
  });

  it('stops emitting and unsubscribes after teardown', async () => {
    const states: AuthState[] = [];
    const { client, fire, unsubscribe } = makeClient({});
    const stop = startAuthController(client as never, (s) => states.push(s));
    await vi.waitFor(() => expect(states.length).toBeGreaterThan(0));
    const countBefore = states.length;
    stop();
    expect(unsubscribe).toHaveBeenCalled();
    fire({ user: { id: 'x' } });
    expect(states.length).toBe(countBefore);
  });
});
