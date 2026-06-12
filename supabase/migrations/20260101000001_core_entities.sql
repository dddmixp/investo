-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- properties
create table properties (
  id             uuid default gen_random_uuid() primary key,
  owner_id       uuid references auth.users not null,
  created_at     timestamptz default now(),
  address        text not null,
  type           text check (type in ('apartment','house','commercial','land')),
  status         text check (status in ('owned','for_sale','sold')),
  purchase_date  date,
  purchase_price integer,
  current_value  integer
);
alter table properties enable row level security;
create policy "owner access" on properties for all using (auth.uid() = owner_id);

-- tenants
create table tenants (
  id         uuid default gen_random_uuid() primary key,
  owner_id   uuid references auth.users not null,
  created_at timestamptz default now(),
  name       text not null,
  egn        text,
  phone      text,
  email      text,
  whatsapp   text,
  notes      text
);
alter table tenants enable row level security;
create policy "owner access" on tenants for all using (auth.uid() = owner_id);

-- tenancies
create table tenancies (
  id           uuid default gen_random_uuid() primary key,
  owner_id     uuid references auth.users not null,
  created_at   timestamptz default now(),
  property_id  uuid references properties not null,
  tenant_id    uuid references tenants not null,
  start_date   date not null,
  end_date     date,
  monthly_rent integer not null,
  deposit      integer,
  payment_day  smallint default 1,
  status       text check (status in ('active','expired','terminated'))
);
alter table tenancies enable row level security;
create policy "owner access" on tenancies for all using (auth.uid() = owner_id);
create index tenancies_property_id_idx on tenancies(property_id);
create index tenancies_tenant_id_idx on tenancies(tenant_id);
create index tenancies_status_idx on tenancies(status);
