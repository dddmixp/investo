'use server';
import { createServerClient } from '@/lib/supabase/server';
import { getOverdueAlerts } from '@/lib/dashboard';

export async function sendOverdueNotifications(): Promise<{ sent: number }> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { sent: 0 };

  const today = new Date();
  const dateKey = today.toISOString().split('T')[0];

  // Fetch tenancies and existing payments
  const { data: tenancies } = await supabase
    .from('tenancies')
    .select('id, property_id, payment_day, is_active');
  const alerts = getOverdueAlerts(tenancies ?? [], new Set(), today);

  // Fetch push tokens
  const { data: tokens } = await supabase
    .from('push_tokens')
    .select('token')
    .eq('owner_id', user.id);
  if (!tokens?.length || !alerts.length) return { sent: 0 };

  let sent = 0;
  for (const alert of alerts) {
    const notifKey = `overdue:${alert.tenancy_id}:${dateKey}`;
    // Check if already sent today
    const { data: existing } = await supabase
      .from('sent_notifications')
      .select('id')
      .eq('owner_id', user.id)
      .eq('notification_key', notifKey)
      .single();
    if (existing) continue;

    // Send to all registered tokens
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';
    for (const { token } of tokens) {
      await fetch(`${appUrl}/api/push/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Payment Overdue',
          body: `Rent overdue for tenancy (${alert.daysOverdue} days)`,
          token,
        }),
      });
    }

    // Mark as sent
    await supabase
      .from('sent_notifications')
      .insert({ owner_id: user.id, notification_key: notifKey });
    sent++;
  }
  return { sent };
}
