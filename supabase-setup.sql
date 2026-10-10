create table if not exists public.video_requests (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 1 and 80),
  item text not null check (char_length(trim(item)) between 1 and 160),
  created_at timestamptz not null default now()
);

-- Repair an existing table created without the fields the website submits.
alter table public.video_requests add column if not exists name text;
alter table public.video_requests add column if not exists item text;
update public.video_requests set name = 'Unknown requester' where name is null or trim(name) = '';
update public.video_requests set item = 'Request details unavailable' where item is null or trim(item) = '';
alter table public.video_requests alter column name set not null;
alter table public.video_requests alter column item set not null;

alter table public.video_requests enable row level security;

grant insert on table public.video_requests to anon, authenticated;
grant select on table public.video_requests to authenticated;

drop policy if exists "Anyone can submit a request" on public.video_requests;
create policy "Anyone can submit a request"
  on public.video_requests
  for insert
  to anon, authenticated
  with check (
    char_length(trim(name)) between 1 and 80
    and char_length(trim(item)) between 1 and 160
  );

drop policy if exists "Only the owner can view requests" on public.video_requests;
create policy "Only the owner can view requests"
  on public.video_requests
  for select
  to authenticated
  using (
    lower(coalesce(auth.jwt() ->> 'email', '')) = lower('karaas.botros2@gmail.com')
  );

notify pgrst, 'reload schema';

