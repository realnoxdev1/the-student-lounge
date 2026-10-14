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

-- Optional Helper assignments; each signed-in user can only read their own assignment.
create table if not exists public.request_helpers (
  user_id uuid primary key references auth.users(id) on delete cascade,
  granted_at timestamptz not null default now()
);

alter table public.request_helpers enable row level security;
revoke all on table public.request_helpers from anon, authenticated;
grant select on table public.request_helpers to authenticated;

drop policy if exists "Helpers can read their own assignment" on public.request_helpers;
create policy "Helpers can read their own assignment"
  on public.request_helpers
  for select
  to authenticated
  using (auth.uid() = user_id);

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
drop policy if exists "Owner and helpers can view requests" on public.video_requests;
drop policy if exists "Developer emails can view requests" on public.video_requests;
do $$
declare
  existing_policy record;
begin
  for existing_policy in
    select policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = 'video_requests'
      and cmd = 'SELECT'
  loop
    execute format('drop policy %I on public.video_requests', existing_policy.policyname);
  end loop;
end;
$$;

create policy "Developer emails can view requests"
  on public.video_requests
  for select
  to authenticated
  using (
    lower(coalesce(auth.jwt() ->> 'email', '')) in (
      'kbotros2027@staschool.us',
      'karaas.botros2@gmail.com'
    )
  );

notify pgrst, 'reload schema';

-- Staff role checks use the authenticated user's current Auth record rather
-- than relying on a possibly stale email claim in the access token.
create or replace function public.is_lounge_developer()
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select exists (
    select 1
    from auth.users as account
    where account.id = (select auth.uid())
      and lower(coalesce(account.email, '')) in (
        'kbotros2027@staschool.us',
        'karaas.botros2@gmail.com'
      )
  );
$function$;

create or replace function public.is_lounge_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select exists (
    select 1
    from auth.users as account
    where account.id = (select auth.uid())
      and lower(coalesce(account.email, '')) in (
        'kbotros2027@staschool.us',
        'karaas.botros2@gmail.com',
        'aluckay2027@staschool.us'
      )
  );
$function$;

revoke all on function public.is_lounge_developer() from public;
revoke all on function public.is_lounge_staff() from public;
grant execute on function public.is_lounge_developer() to anon, authenticated;
grant execute on function public.is_lounge_staff() to anon, authenticated;

drop policy if exists "Developer emails can view requests" on public.video_requests;
drop policy if exists "Developers can view requests" on public.video_requests;
create policy "Developers can view requests"
  on public.video_requests
  for select
  to authenticated
  using (public.is_lounge_developer());

-- All existing page videos and games live in this table so Helpers and
-- Developers can manage every item, not only newly-added embeds.
create table if not exists public.lounge_media (
  id uuid primary key default gen_random_uuid(),
  person_slug text not null check (person_slug in (
    'micheal-phelps', 'micheal-collins', 'colin-o', 'aidan', 'christian', 'henry'
  )),
  kind text not null check (kind in ('video', 'game')),
  title text not null check (char_length(trim(title)) between 1 and 120),
  embed_url text not null check (embed_url ~ '^https://'),
  is_active boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.lounge_media enable row level security;
grant select on table public.lounge_media to anon, authenticated;
grant insert, update on table public.lounge_media to authenticated;
create unique index if not exists lounge_media_person_kind_url_idx
  on public.lounge_media (person_slug, kind, embed_url);

drop policy if exists "Anyone can view active page media" on public.lounge_media;
create policy "Anyone can view active page media"
  on public.lounge_media
  for select
  to anon, authenticated
  using (is_active or public.is_lounge_staff());

drop policy if exists "Helpers and Developers can add page media" on public.lounge_media;
create policy "Helpers and Developers can add page media"
  on public.lounge_media
  for insert
  to authenticated
  with check (public.is_lounge_staff() and created_by = auth.uid());

drop policy if exists "Helpers and Developers can update page media" on public.lounge_media;
create policy "Helpers and Developers can update page media"
  on public.lounge_media
  for update
  to authenticated
  using (public.is_lounge_staff())
  with check (public.is_lounge_staff());

insert into public.lounge_media (person_slug, kind, title, embed_url) values
  ('micheal-phelps', 'video', 'Unstable SMP: The Mafia', 'https://www.youtube-nocookie.com/embed/CpNP39w2hEk'),
  ('micheal-phelps', 'video', 'STELLA LEFTY - Boston', 'https://www.youtube-nocookie.com/embed/VrChRBLw3OQ'),
  ('micheal-collins', 'video', 'Tom & Jerry in Full Screen', 'https://www.youtube-nocookie.com/embed/t0Q2otsqC4I'),
  ('colin-o', 'video', 'Lil Baby - Dead Fresh', 'https://www.youtube-nocookie.com/embed/PXxbEfhtDiM'),
  ('colin-o', 'video', 'Kodak Black - Already', 'https://www.youtube-nocookie.com/embed/vhmpbXsAl9c'),
  ('colin-o', 'video', 'Don Toliver - E85', 'https://www.youtube-nocookie.com/embed/7GwLnsVUwHY'),
  ('colin-o', 'video', 'Drake - Headlines', 'https://www.youtube-nocookie.com/embed/cimoNqiulUE'),
  ('colin-o', 'video', 'Kanye West - Homecoming', 'https://www.youtube-nocookie.com/embed/LQ488QrqGE4'),
  ('colin-o', 'video', 'Don Toliver - Excavator', 'https://www.youtube-nocookie.com/embed/_SrosL0WdOQ'),
  ('aidan', 'video', 'Lil Baby - Dead Fresh', 'https://www.youtube-nocookie.com/embed/PXxbEfhtDiM'),
  ('aidan', 'video', 'Don Toliver - No Pole', 'https://www.youtube-nocookie.com/embed/nM_ZUbSIA0Q'),
  ('aidan', 'video', 'Djo - End Of Beginning (Lyrics)', 'https://www.youtube-nocookie.com/embed/B3Z4XGAxJB0'),
  ('aidan', 'video', 'The Killers - Mr Brightside (Lyrics)', 'https://www.youtube-nocookie.com/embed/j8tZs6G_h7U'),
  ('aidan', 'video', 'Mustard - Pure Water [Lyrics/Lyric] Ft. Migos', 'https://www.youtube-nocookie.com/embed/hVsEbUm-kb0'),
  ('aidan', 'game', 'Tetr.io-style game', 'https://telatro.tomcat.sh/game/'),
  ('aidan', 'game', 'Retro Bowl', 'https://falloutscript.github.io/Retrobowl/'),
  ('christian', 'video', 'Rebecca Black - Friday', 'https://www.youtube-nocookie.com/embed/WqVIvVh-dkI'),
  ('christian', 'video', 'ELO - Mr Blue Sky', 'https://www.youtube-nocookie.com/embed/sQiPtneudlo'),
  ('christian', 'video', 'Pharrell Williams - Double Life', 'https://www.youtube-nocookie.com/embed/fWtn6RMNiok'),
  ('christian', 'video', 'Avicii - The Nights (Lyrics)', 'https://www.youtube-nocookie.com/embed/H78YW7ycuwI'),
  ('christian', 'video', 'Post Malone, Swae Lee - Sunflower', 'https://www.youtube-nocookie.com/embed/ApXoWvfEYVU'),
  ('christian', 'video', 'Imagine Dragons - Believer', 'https://www.youtube-nocookie.com/embed/W0DM5lcj6mw'),
  ('christian', 'video', 'Redbone - Come and Get Your Love', 'https://www.youtube-nocookie.com/embed/wFwYcHjP-YU'),
  ('christian', 'video', 'Imagine Dragons - Thunder', 'https://www.youtube-nocookie.com/embed/GtEvysh1654'),
  ('christian', 'video', 'The Buggles - Video Killed The Radio Star (Lyrics)', 'https://www.youtube-nocookie.com/embed/XMEN_FsVg_c'),
  ('christian', 'video', 'Silver - Wham Bam Shang-A-Lang', 'https://www.youtube-nocookie.com/embed/M5iSEdo5VNI'),
  ('christian', 'video', 'Blue Swede - Hooked On A Feeling', 'https://www.youtube-nocookie.com/embed/Bo-qweh7nbQ'),
  ('christian', 'game', 'Retro Bowl', 'https://falloutscript.github.io/Retrobowl/'),
  ('henry', 'game', 'Tetr.io-style game', 'https://telatro.tomcat.sh/game/')
on conflict (person_slug, kind, embed_url) do nothing;

notify pgrst, 'reload schema';

create table if not exists public.user_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  username text not null default 'Lounge member' check (char_length(trim(username)) between 1 and 30),
  avatar_url text,
  banner_url text,
  preferred_font text not null default 'classic' check (preferred_font in ('classic', 'dm-sans', 'lora', 'nunito', 'fraunces', 'manrope')),
  role text check (role is null or role in ('developer', 'helper')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_profiles add column if not exists role text;
alter table public.user_profiles drop constraint if exists user_profiles_role_check;
alter table public.user_profiles add constraint user_profiles_role_check
  check (role is null or role in ('developer', 'helper'));

create or replace function public.sync_user_profile_role()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  account_email text;
begin
  select lower(email) into account_email
  from auth.users
  where id = new.user_id;

  new.role := case
    when account_email in ('kbotros2027@staschool.us', 'karaas.botros2@gmail.com') then 'developer'
    when account_email = 'aluckay2027@staschool.us' then 'helper'
    else null
  end;
  return new;
end;
$$;

drop trigger if exists sync_user_profile_role on public.user_profiles;
create trigger sync_user_profile_role
before insert or update on public.user_profiles
for each row execute function public.sync_user_profile_role();

update public.user_profiles as profile
set role = case
  when lower(account.email) in ('kbotros2027@staschool.us', 'karaas.botros2@gmail.com') then 'developer'
  when lower(account.email) = 'aluckay2027@staschool.us' then 'helper'
  else null
end
from auth.users as account
where account.id = profile.user_id;

create or replace function public.create_user_profile_for_new_account()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  insert into public.user_profiles (user_id, username)
  values (
    new.id,
    left(coalesce(nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''), split_part(new.email, '@', 1), 'Lounge member'), 30)
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists create_user_profile_for_new_account on auth.users;
create trigger create_user_profile_for_new_account
after insert on auth.users
for each row execute function public.create_user_profile_for_new_account();

insert into public.user_profiles (user_id, username)
select
  account.id,
  left(coalesce(nullif(trim(account.raw_user_meta_data ->> 'display_name'), ''), split_part(account.email, '@', 1), 'Lounge member'), 30)
from auth.users as account
on conflict (user_id) do nothing;

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

drop policy if exists "Avatar pictures are publicly viewable" on storage.objects;
create policy "Avatar pictures are publicly viewable"
on storage.objects
for select
to public
using (bucket_id = 'avatars');

drop policy if exists "Authenticated users can upload avatars" on storage.objects;
create policy "Authenticated users can upload avatars"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Authenticated users can update their avatars" on storage.objects;
create policy "Authenticated users can update their avatars"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Authenticated users can delete avatars" on storage.objects;
create policy "Authenticated users can delete avatars"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

alter table public.user_profiles enable row level security;
grant select on table public.user_profiles to anon, authenticated;
grant insert, update, delete on table public.user_profiles to authenticated;

drop policy if exists "Anyone can read profiles" on public.user_profiles;
create policy "Anyone can read profiles"
  on public.user_profiles
  for select
  to anon, authenticated
  using (true);

drop policy if exists "Users can manage their own profile" on public.user_profiles;
create policy "Users can manage their own profile"
  on public.user_profiles
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  message text not null check (char_length(trim(message)) between 1 and 280),
  created_at timestamptz not null default now()
);

alter table public.chat_messages enable row level security;
grant select, insert on table public.chat_messages to authenticated;

drop policy if exists "Authenticated users can view chat messages" on public.chat_messages;
create policy "Authenticated users can view chat messages"
  on public.chat_messages
  for select
  to authenticated
  using (true);

drop policy if exists "Authenticated users can post chat messages" on public.chat_messages;
create policy "Authenticated users can post chat messages"
  on public.chat_messages
  for insert
  to authenticated
  with check (auth.uid() = user_id and char_length(trim(message)) between 1 and 280);

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

-- To grant a Helper Pro themes, replace HELPER_EMAIL_HERE
-- with their registered email, then run this statement in the SQL Editor.
-- insert into public.pro_entitlements (user_id, grant_reason)
-- select id, 'helper' from auth.users where lower(email) = lower('HELPER_EMAIL_HERE')
-- on conflict (user_id) do update
-- set grant_reason = excluded.grant_reason, expires_at = null;

notify pgrst, 'reload schema';

