-- Push tokens table
create table if not exists public.push_tokens (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  token text not null,
  platform text not null check (platform in ('ios', 'android', 'web')),
  created_at timestamptz not null default now(),
  unique(owner_id, token)
);

alter table public.push_tokens enable row level security;
create policy "owner can manage own tokens" on public.push_tokens
  for all using (auth.uid() = owner_id);

-- Sent notifications deduplication table
create table if not exists public.sent_notifications (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  notification_key text not null,  -- e.g. "overdue:tenancy_id:2026-06-12"
  sent_at timestamptz not null default now(),
  unique(owner_id, notification_key)
);

alter table public.sent_notifications enable row level security;
create policy "owner can manage own sent_notifications" on public.sent_notifications
  for all using (auth.uid() = owner_id);
