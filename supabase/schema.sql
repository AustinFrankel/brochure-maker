-- Brochure Maker: the whole database.
--
-- Run this in a fresh Supabase project's SQL editor, then put the project URL
-- and its publishable (anon) key in NEXT_PUBLIC_SUPABASE_URL and
-- NEXT_PUBLIC_SUPABASE_ANON_KEY.
--
-- Note the access model: this app has no accounts by design. It is an internal
-- tool for a small group who all work on the same brochures. The policies below
-- are therefore deliberately open to the anonymous key. Row level security is
-- switched on rather than left off so that tightening access later is a policy
-- edit rather than a rewrite.

create table if not exists public.brochures (
  id         uuid primary key default gen_random_uuid(),
  title      text not null,
  doc        jsonb not null,
  thumb_url  text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.brochure_versions (
  id          uuid primary key default gen_random_uuid(),
  brochure_id uuid not null references public.brochures(id) on delete cascade,
  doc         jsonb not null,
  label       text,
  created_at  timestamptz not null default now()
);

create index if not exists brochures_updated_at_idx
  on public.brochures (updated_at desc);
create index if not exists brochure_versions_brochure_idx
  on public.brochure_versions (brochure_id, created_at desc);

-- Deliberately open access (see the note above).
alter table public.brochures         enable row level security;
alter table public.brochure_versions enable row level security;

drop policy if exists "brochures open" on public.brochures;
drop policy if exists "versions open"  on public.brochure_versions;

create policy "brochures open" on public.brochures
  for all to anon, authenticated using (true) with check (true);
create policy "versions open" on public.brochure_versions
  for all to anon, authenticated using (true) with check (true);

grant usage on schema public to anon, authenticated;
grant all on public.brochures, public.brochure_versions to anon, authenticated;

-- Photos and imported page backgrounds. Public so that <img src> just works.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'media', 'media', true, 20971520,
  array['image/jpeg','image/png','image/webp','image/gif','image/avif']
)
on conflict (id) do update
  set public             = excluded.public,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "media public read"   on storage.objects;
drop policy if exists "media public write"  on storage.objects;
drop policy if exists "media public update" on storage.objects;
drop policy if exists "media public delete" on storage.objects;

create policy "media public read"   on storage.objects for select using (bucket_id = 'media');
create policy "media public write"  on storage.objects for insert with check (bucket_id = 'media');
create policy "media public update" on storage.objects for update using (bucket_id = 'media');
create policy "media public delete" on storage.objects for delete using (bucket_id = 'media');
