import { useState, useEffect } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface UseAuthResult {
  session: Session | null;
  loading: boolean;
  authUnavailable: boolean;
}

export function useAuth(): UseAuthResult {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [authUnavailable, setAuthUnavailable] = useState(false);

  useEffect(() => {
    let mounted = true;

    supabase.auth
      .getSession()
      .then(({ data: { session: s }, error }) => {
        if (!mounted) return;
        if (error) {
          setAuthUnavailable(true);
        } else {
          setSession(s);
        }
        setLoading(false);
      })
      .catch(() => {
        if (!mounted) return;
        setAuthUnavailable(true);
        setLoading(false);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => {
      if (!mounted) return;
      setSession(s);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return { session, loading, authUnavailable };
}
