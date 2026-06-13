import type { SupabaseClient } from '@supabase/supabase-js';

export interface LoginSubmitResult {
  ok: boolean;
  error: string | null;
}

/**
 * Validate raw login form input. Email is trimmed before checking so that
 * whitespace-only emails are rejected and leading/trailing spaces are stripped.
 * Returns the normalized credentials on success, or an error message.
 */
export function validateLoginForm(
  rawEmail: string,
  password: string
): { ok: true; email: string; password: string } | { ok: false; error: string } {
  const email = rawEmail.trim();
  if (!email || !password) {
    return { ok: false, error: 'Email and password are required.' };
  }
  return { ok: true, email, password };
}

/**
 * Validate and attempt a password sign-in via the supplied supabase client.
 * The email is trimmed before being sent to supabase.
 */
export async function submitLogin(
  client: Pick<SupabaseClient, 'auth'>,
  rawEmail: string,
  password: string
): Promise<LoginSubmitResult> {
  const validation = validateLoginForm(rawEmail, password);
  if (!validation.ok) {
    return { ok: false, error: validation.error };
  }
  const { error } = await client.auth.signInWithPassword({
    email: validation.email,
    password: validation.password,
  });
  if (error) {
    return { ok: false, error: error.message };
  }
  return { ok: true, error: null };
}
