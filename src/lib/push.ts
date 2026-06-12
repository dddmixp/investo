import { createServerClient } from '@/lib/supabase/server';

export async function sendPushIfNotSent(
  ownerToken: string,
  notificationKey: string,
  title: string,
  body: string,
): Promise<void> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: existing } = await supabase
    .from('sent_notifications')
    .select('id')
    .eq('owner_id', user.id)
    .eq('notification_key', notificationKey)
    .single();

  if (existing) return;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';
  await fetch(`${appUrl}/api/push/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, body, token: ownerToken }),
  });

  await supabase
    .from('sent_notifications')
    .insert({ owner_id: user.id, notification_key: notificationKey });
}

export function isExpoPushToken(token: string): boolean {
  return token.startsWith('ExponentPushToken[') || token.startsWith('ExpoPushToken[');
}
