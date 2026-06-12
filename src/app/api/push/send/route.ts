import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

type PushPayload = { title: string; body: string; token: string };

export async function POST(req: Request) {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { title, body, token } = (await req.json()) as PushPayload;
  if (!title || !body || !token) {
    return NextResponse.json({ error: 'title, body, token required' }, { status: 400 });
  }

  const message = {
    to: token,
    sound: 'default' as const,
    title,
    body,
    data: {},
  };

  const res = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(message),
  });

  if (!res.ok) {
    const err = await res.text();
    return NextResponse.json({ error: err }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
