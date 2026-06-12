import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockCreate = vi.fn().mockResolvedValue({
  content: [
    {
      type: 'text',
      text: JSON.stringify({
        tenant_name: 'John Doe',
        monthly_rent: 500,
        start_date: '2026-01-01',
      }),
    },
  ],
});

vi.mock('@anthropic-ai/sdk', () => {
  function MockAnthropic() {
    return { messages: { create: mockCreate } };
  }
  return { default: MockAnthropic };
});

vi.mock('@/lib/supabase/server', () => ({ createServerClient: vi.fn() }));

import { createServerClient } from '@/lib/supabase/server';
import { POST } from '@/app/api/documents/extract/route';

const mockSupabase = {
  auth: { getUser: vi.fn() },
  from: vi.fn(),
  storage: { from: vi.fn() },
};

function makeDocChain(doc: unknown) {
  return {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: doc }),
    update: vi.fn().mockReturnThis(),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  (createServerClient as ReturnType<typeof vi.fn>).mockResolvedValue(mockSupabase);
  mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'owner-1' } } });
});

describe('POST /api/documents/extract', () => {
  it('returns 401 when not authenticated', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });
    const req = new Request('http://localhost/api/documents/extract', {
      method: 'POST',
      body: JSON.stringify({ documentId: 'd1' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('returns 404 when document not found', async () => {
    const chain = makeDocChain(null);
    mockSupabase.from.mockReturnValue(chain);
    const req = new Request('http://localhost/api/documents/extract', {
      method: 'POST',
      body: JSON.stringify({ documentId: 'missing' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req);
    expect(res.status).toBe(404);
  });

  it('returns extracted data for image document', async () => {
    const doc = {
      id: 'd1',
      storage_path: 'owner-1/property/e1/file.jpg',
      doc_type: 'rental_contract',
      owner_id: 'owner-1',
      filename: 'contract.jpg',
    };
    const chain = { ...makeDocChain(doc), update: vi.fn().mockReturnThis() };
    mockSupabase.from.mockReturnValue(chain);
    mockSupabase.storage.from.mockReturnValue({
      createSignedUrl: vi.fn().mockResolvedValue({
        data: { signedUrl: 'http://example.com/file.jpg' },
        error: null,
      }),
    });
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('example.com')) {
        return Promise.resolve({
          ok: true,
          headers: { get: () => 'image/jpeg' },
          arrayBuffer: () => Promise.resolve(new ArrayBuffer(10)),
        });
      }
      return Promise.resolve({ ok: true });
    }) as unknown as typeof fetch;

    const req = new Request('http://localhost/api/documents/extract', {
      method: 'POST',
      body: JSON.stringify({ documentId: 'd1' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req);
    const body = (await res.json()) as { extractedData: Record<string, unknown> };
    expect(body.extractedData).toMatchObject({ tenant_name: 'John Doe', monthly_rent: 500 });
  });
});
