import '@testing-library/jest-dom'

// Provide dummy Supabase env vars so env-guarded modules (middleware, server
// client) can be imported under test without throwing. Real values are never
// needed because the Supabase clients are mocked in the tests that use them.
process.env.NEXT_PUBLIC_SUPABASE_URL ||= 'http://localhost:54321'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||= 'test-anon-key'
