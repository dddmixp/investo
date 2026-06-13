/**
 * Supabase server client stub.
 * Replace with the real @supabase/supabase-js implementation once the package is installed.
 */

/** Result of an awaited Supabase query. */
type QueryResult<T = unknown> = {
  data: T[] | null;
  error: { message: string } | null;
};

/**
 * Minimal structural type for the query-builder chain the app relies on.
 * It mirrors the subset of the `@supabase/supabase-js` API in use so that
 * call sites are type-checked without resorting to `any`.
 */
interface QueryBuilder<T = unknown> extends PromiseLike<QueryResult<T>> {
  select(columns?: string): QueryBuilder<T>;
  gte(column: string, value: string | number): QueryBuilder<T>;
  order(column: string, options?: { ascending?: boolean }): QueryBuilder<T>;
  limit(count: number): QueryBuilder<T>;
}

export interface SupabaseClient {
  from<T = unknown>(table: string): QueryBuilder<T>;
}

export function createServerClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) {
    throw new Error('Missing Supabase env var: NEXT_PUBLIC_SUPABASE_URL');
  }
  if (!key) {
    throw new Error('Missing Supabase env var: SUPABASE_SERVICE_ROLE_KEY');
  }

  // TODO: replace with createClient(url, key) once @supabase/supabase-js is installed
  throw new Error('Supabase client not configured — install @supabase/supabase-js');
}
