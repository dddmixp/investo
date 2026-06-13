import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { BookingFormData } from '@/app/actions/bookings';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const revalidatePath = vi.fn();
vi.mock('next/cache', () => ({
  revalidatePath: (...args: unknown[]) => revalidatePath(...args),
}));

// redirect() in Next throws to unwind; we mirror that so success paths are
// observable via a thrown sentinel.
const redirect = vi.fn((path: string) => {
  throw new Error(`__REDIRECT__:${path}`);
});
vi.mock('next/navigation', () => ({
  redirect: (path: string) => redirect(path),
}));

// Mutable handles the mocked supabase client reads from.
let mockUser: { id: string } | null = { id: 'owner-1' };
let existingBookings: Array<{
  id: string;
  check_in: string;
  check_out: string;
  property_id: string;
  status: string;
}> = [];
let insertError: { message: string } | null = null;
const insertSpy = vi.fn();

function makeSupabase() {
  return {
    auth: {
      getUser: async () => ({ data: { user: mockUser } }),
    },
    from(_table: string) {
      return {
        select() {
          return {
            eq: async () => ({ data: existingBookings, error: null }),
          };
        },
        insert(payload: unknown) {
          insertSpy(payload);
          return Promise.resolve({ error: insertError });
        },
      };
    },
  };
}

vi.mock('@/lib/supabase/server', () => ({
  createServerClient: async () => makeSupabase(),
}));

import { createBooking } from '@/app/actions/bookings';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function validData(overrides: Partial<BookingFormData> = {}): BookingFormData {
  return {
    property_id: 'p1',
    guest_name: 'Alice',
    guest_phone: '',
    guest_email: '',
    check_in: '2026-06-10',
    check_out: '2026-06-13',
    nightly_rate: '100',
    cleaning_fee: '50',
    deposit: '',
    source: 'direct',
    status: 'confirmed',
    notes: '',
    ...overrides,
  };
}

beforeEach(() => {
  mockUser = { id: 'owner-1' };
  existingBookings = [];
  insertError = null;
  insertSpy.mockClear();
  revalidatePath.mockClear();
  redirect.mockClear();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('createBooking — validation', () => {
  it('rejects a missing property', async () => {
    const res = await createBooking(validData({ property_id: '' }));
    expect(res).toEqual({ error: 'Property is required' });
    expect(insertSpy).not.toHaveBeenCalled();
  });

  it('rejects a blank guest name', async () => {
    const res = await createBooking(validData({ guest_name: '  ' }));
    expect(res).toEqual({ error: 'Guest name is required' });
  });

  it('rejects check-out on or before check-in', async () => {
    const res = await createBooking(
      validData({ check_in: '2026-06-10', check_out: '2026-06-10' }),
    );
    expect(res).toEqual({ error: 'Check-out must be after check-in' });
  });

  it('rejects a non-positive nightly rate', async () => {
    const res = await createBooking(validData({ nightly_rate: '0' }));
    expect(res).toEqual({ error: 'Nightly rate is required' });
  });

  it('rejects an invalid status', async () => {
    const res = await createBooking(validData({ status: 'bogus' }));
    expect(res).toEqual({ error: 'Invalid booking status' });
  });

  it('rejects an invalid source', async () => {
    const res = await createBooking(validData({ source: 'craigslist' }));
    expect(res).toEqual({ error: 'Invalid booking source' });
  });

  it('allows an empty source', async () => {
    await expect(createBooking(validData({ source: '' }))).rejects.toThrow(
      '__REDIRECT__:/bookings',
    );
  });
});

describe('createBooking — authentication', () => {
  it('rejects when no user is authenticated', async () => {
    mockUser = null;
    const res = await createBooking(validData());
    expect(res).toEqual({ error: 'Not authenticated' });
  });
});

describe('createBooking — overlap', () => {
  it('rejects an overlapping booking', async () => {
    existingBookings = [
      {
        id: 'b1',
        check_in: '2026-06-11',
        check_out: '2026-06-15',
        property_id: 'p1',
        status: 'confirmed',
      },
    ];
    const res = await createBooking(validData());
    expect(res).toEqual({
      error: 'This property is already booked for the selected dates',
    });
    expect(insertSpy).not.toHaveBeenCalled();
  });

  it('inserts and redirects on a non-overlapping booking', async () => {
    existingBookings = [
      {
        id: 'b1',
        check_in: '2026-07-01',
        check_out: '2026-07-05',
        property_id: 'p1',
        status: 'confirmed',
      },
    ];
    await expect(createBooking(validData())).rejects.toThrow(
      '__REDIRECT__:/bookings',
    );
    expect(insertSpy).toHaveBeenCalledTimes(1);
    const payload = insertSpy.mock.calls[0][0] as Record<string, unknown>;
    // 3 nights * 100 + 50 cleaning = 350 EUR -> 35000 cents.
    expect(payload.total_amount).toBe(35000);
    expect(payload.nightly_rate).toBe(10000);
    expect(payload.owner_id).toBe('owner-1');
    expect(revalidatePath).toHaveBeenCalledWith('/bookings');
  });

  it('returns the db error when insert fails', async () => {
    insertError = { message: 'db exploded' };
    const res = await createBooking(validData());
    expect(res).toEqual({ error: 'db exploded' });
  });
});
