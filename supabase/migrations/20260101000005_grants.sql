-- Data API privileges for the public schema.
--
-- RLS policies restrict WHICH rows a user sees, but the underlying role still
-- needs table-level GRANTs to access the table at all. Supabase historically
-- auto-granted these to anon/authenticated; newer CLI/hosted defaults no longer
-- auto-expose new public objects, so we grant explicitly. Row visibility stays
-- governed by the RLS policies defined in the earlier migrations.

grant usage on schema public to anon, authenticated;

grant select, insert, update, delete on all tables in schema public to authenticated;
grant select on all tables in schema public to anon;
grant usage, select on all sequences in schema public to anon, authenticated;

-- Apply the same defaults to any future objects created by the migration owner.
alter default privileges in schema public
  grant select, insert, update, delete on tables to authenticated;
alter default privileges in schema public
  grant select on tables to anon;
alter default privileges in schema public
  grant usage, select on sequences to anon, authenticated;
