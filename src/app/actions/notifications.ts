'use server';
import { createServerClient } from '@/lib/supabase/server';
import { getOverdueAlerts } from '@/lib/dashboard';
import { sendExpoPush } from '@/lib/push';

type TenancyRow = {
  id: string;
  property_id: string;
  payment_day: number;
  is_active: boolean;
  // tenants join — Supabase returns a related row (or array) for the FK.
  tenants?: { name: string | null } | { name: string | null }[] | null;
};

export async function sendOverdueNotifications(): Promise<{ sent: number }> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { sent: 0 };

  const today = new Date();
  const dateKey = today.toISOString().split('T')[0];

  // Fetch tenancies (joining the tenant name so alerts aren't all 'Unknown').
  const { data: tenancyRows } = await supabase
    .from('tenancies')
    .select('id, property_id, payment_day, is_active, tenants(name)')
    .eq('owner_id', user.id);

  const tenancies = ((tenancyRows ?? []) as TenancyRow[]).map((t) => {
    const tenant = Array.isArray(t.tenants) ? t.tenants[0] : t.tenants;
    return {
      id: t.id,
      property_id: t.property_id,
      payment_day: t.payment_day,
      is_active: t.is_active,
      tenant_name: tenant?.name ?? null,
    };
  });

  // Build the set of tenancies that already paid rent this month so they are
  // not flagged as overdue. Rent payments are income transactions categorised
  // as 'rent' and linked to the tenancy via tenancy_id.
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const monthStartKey = monthStart.toISOString().split('T')[0];
  const { data: paidTx } = await supabase
    .from('transactions')
    .select('tenancy_id')
    .eq('owner_id', user.id)
    .eq('type', 'income')
    .eq('category', 'rent')
    .gte('date', monthStartKey);

  const paidTenancyIds = new Set<string>(
    ((paidTx ?? []) as { tenancy_id: string | null }[])
      .map((row) => row.tenancy_id)
      .filter((id): id is string => Boolean(id)),
  );

  const alerts = getOverdueAlerts(tenancies, paidTenancyIds, today);

  // Fetch push tokens
  const { data: tokens } = await supabase
    .from('push_tokens')
    .select('token')
    .eq('owner_id', user.id);
  if (!tokens?.length || !alerts.length) return { sent: 0 };

  // Batch-fetch notification keys already sent today (avoids an N+1 lookup).
  const notifKeys = alerts.map((a) => `overdue:${a.tenancy_id}:${dateKey}`);
  const { data: existingRows } = await supabase
    .from('sent_notifications')
    .select('notification_key')
    .eq('owner_id', user.id)
    .in('notification_key', notifKeys);
  const alreadySent = new Set<string>(
    ((existingRows ?? []) as { notification_key: string }[]).map(
      (r) => r.notification_key,
    ),
  );

  let sent = 0;
  for (const alert of alerts) {
    const notifKey = `overdue:${alert.tenancy_id}:${dateKey}`;
    if (alreadySent.has(notifKey)) continue;

    // Send to all registered tokens via Expo directly (no relative fetch).
    for (const { token } of tokens) {
      await sendExpoPush(
        token,
        'Payment Overdue',
        `Rent overdue for tenancy (${alert.daysOverdue} days)`,
      );
    }

    // Mark as sent
    await supabase
      .from('sent_notifications')
      .insert({ owner_id: user.id, notification_key: notifKey });
    sent++;
  }
  return { sent };
}
