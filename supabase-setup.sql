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

-- Account-linked Pro access: signed-in users can read their own entitlement;
-- no browser client can grant or edit Pro status.
create table if not exists public.pro_entitlements (
  user_id uuid primary key references auth.users(id) on delete cascade,
  granted_at timestamptz not null default now(),
  expires_at timestamptz,
  grant_reason text not null default 'helper'
);

alter table public.pro_entitlements enable row level security;
revoke all on table public.pro_entitlements from anon, authenticated;
grant select on table public.pro_entitlements to authenticated;

drop policy if exists "Users can read their own Pro status" on public.pro_entitlements;
create policy "Users can read their own Pro status"
  on public.pro_entitlements
  for select
  to authenticated
  using (auth.uid() = user_id);

-- To grant Pro after a helper has created an account, replace the email below
-- and run this separately in the Supabase SQL Editor:
-- insert into public.pro_entitlements (user_id, grant_reason)
-- select id, 'helper' from auth.users where lower(email) = lower('HELPER_EMAIL_HERE')
-- on conflict (user_id) do update set grant_reason = excluded.grant_reason, expires_at = null;

notify pgrst, 'reload schema';

