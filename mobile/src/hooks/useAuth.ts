import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { initialAuthState, startAuthController, type AuthState } from './authController';

export type UseAuthResult = AuthState;

export function useAuth(): UseAuthResult {
  const [state, setState] = useState<AuthState>(initialAuthState);

  useEffect(() => {
    const stop = startAuthController(supabase, setState);
    return stop;
  }, []);

  return state;
}
