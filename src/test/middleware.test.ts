import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) },
  })),
}));

vi.mock('next/server', async () => {
  const actual = await vi.importActual<typeof import('next/server')>('next/server');
  return {
    ...actual,
    NextResponse: {
      next: vi.fn(() => ({ cookies: { set: vi.fn(), getAll: vi.fn(() => []) } })),
      redirect: vi.fn((url: URL) => ({ redirected: true, url: url.toString() })),
    },
  };
});

import { middleware } from '@/middleware';
import { NextResponse } from 'next/server';

function makeRequest(pathname: string) {
  return {
    nextUrl: new URL(`http://localhost${pathname}`),
    url: `http://localhost${pathname}`,
    cookies: { getAll: () => [], set: vi.fn() },
  } as never;
}

describe('middleware', () => {
  beforeEach(() => vi.clearAllMocks());

  it('redirects unauthenticated user to /login', async () => {
    await middleware(makeRequest('/dashboard'));
    expect(NextResponse.redirect).toHaveBeenCalledWith(
      expect.objectContaining({ pathname: '/login' })
    );
  });

  it('allows unauthenticated user to access /login', async () => {
    await middleware(makeRequest('/login'));
    expect(NextResponse.redirect).not.toHaveBeenCalled();
  });
});
