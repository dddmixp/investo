import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { isExpoPushToken, sendExpoPush } from '@/lib/push';

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
  if (!isExpoPushToken(token)) {
    return NextResponse.json({ error: 'invalid expo push token' }, { status: 400 });
  }

  const ok = await sendExpoPush(token, title, body);
  if (!ok) {
    return NextResponse.json({ error: 'expo push send failed' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
