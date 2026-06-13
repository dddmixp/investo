-- Migration: 20260101000002_finance.sql
-- Depends on: 20260101000001_core.sql (properties, tenants, tenancies tables)
-- Creates: bookings, loans, transactions

-- bookings first (transactions references bookings from this migration)
create table bookings (
  id            uuid default gen_random_uuid() primary key,
  owner_id      uuid references auth.users not null,
  created_at    timestamptz default now(),
  property_id   uuid references properties not null,
  guest_name    text not null,
  guest_phone   text,
  guest_email   text,
  check_in      date not null,
  check_out     date not null,
  nightly_rate  integer,
  total_amount  integer,
  cleaning_fee  integer,
  deposit       integer,
  source        text check (source in ('direct','airbnb','booking_com','other')),
  status        text check (status in ('confirmed','checked_in','checked_out','cancelled')),
  check (check_out > check_in)
);
alter table bookings enable row level security;
create policy "owner access" on bookings for all using (auth.uid() = owner_id);
create index bookings_property_id_checkin_checkout_idx on bookings(property_id, check_in, check_out);

-- loans
create table loans (
  id              uuid default gen_random_uuid() primary key,
  owner_id        uuid references auth.users not null,
  created_at      timestamptz default now(),
  property_id     uuid references properties not null,
  lender          text not null,
  principal       integer not null check (principal > 0),
  interest_rate   numeric(5,2),
  rate_type       text check (rate_type in ('fixed','variable')),
  term_months     integer,
  start_date      date,
  monthly_payment integer,
  outstanding     integer
);
alter table loans enable row level security;
create policy "owner access" on loans for all using (auth.uid() = owner_id);
create index if not exists loans_property_id_idx on loans(property_id);

-- transactions (references tenancies from migration 1 and bookings from this migration)
create table transactions (
  id           uuid default gen_random_uuid() primary key,
  owner_id     uuid references auth.users not null,
  created_at   timestamptz default now(),
  property_id  uuid references properties not null,
  type         text check (type in ('income','expense')) not null,
  category     text,
  amount       integer not null check (amount > 0),
  date         date not null,
  description  text,
  tenancy_id   uuid references tenancies,
  booking_id   uuid references bookings
);
alter table transactions enable row level security;
create policy "owner access" on transactions for all using (auth.uid() = owner_id);
create index transactions_property_id_date_idx on transactions(property_id, date);
