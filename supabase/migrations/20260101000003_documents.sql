-- documents (polymorphic attachment table)
create table documents (
  id             uuid default gen_random_uuid() primary key,
  owner_id       uuid references auth.users not null,
  created_at     timestamptz default now(),
  entity_type    text check (entity_type in ('property','tenancy','booking','transaction','loan')) not null,
  entity_id      uuid not null,
  doc_type       text check (doc_type in ('purchase_deed','rental_contract','loan_agreement','invoice','insurance','utility_bill','permit','other')),
  filename       text not null,
  storage_path   text not null,
  extracted_data jsonb,
  notes          text
);
alter table documents enable row level security;
create policy "owner access" on documents for all using (auth.uid() = owner_id);
create index documents_entity_type_entity_id_idx on documents(entity_type, entity_id);

-- messages
create table messages (
  id         uuid default gen_random_uuid() primary key,
  owner_id   uuid references auth.users not null,
  created_at timestamptz default now(),
  tenant_id  uuid references tenants,
  direction  text check (direction in ('outbound','inbound')),
  channel    text check (channel in ('inapp','email','whatsapp','phone')),
  body       text,
  read       boolean default false
);
alter table messages enable row level security;
create policy "owner access" on messages for all using (auth.uid() = owner_id);

-- Storage bucket for documents (private)
-- Note: bucket creation via Supabase dashboard or CLI: `supabase storage create documents --private`
-- The SQL below creates the bucket via the storage schema if using self-hosted:
insert into storage.buckets (id, name, public) values ('documents', 'documents', false)
  on conflict (id) do nothing;

-- Storage RLS: owner can upload/read/delete only their own files
-- Files must be stored under path: {owner_id}/...
create policy "owner upload" on storage.objects for insert
  with check (bucket_id = 'documents' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "owner read" on storage.objects for select
  using (bucket_id = 'documents' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "owner delete" on storage.objects for delete
  using (bucket_id = 'documents' and auth.uid()::text = (storage.foldername(name))[1]);
