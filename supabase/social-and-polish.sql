-- GymOS polish + privacy-first social migration
-- Run once in the Supabase SQL Editor after schema.sql.

create table if not exists public.gymmi_chats (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'New conversation',
  messages jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.gymmi_daily_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  usage_date date not null default current_date,
  request_count integer not null default 0 check (request_count >= 0),
  primary key (user_id, usage_date)
);

create or replace function public.consume_gymmi_request(daily_limit integer)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  current_count integer;
begin
  if auth.uid() is null then
    return false;
  end if;

  insert into public.gymmi_daily_usage (user_id, usage_date, request_count)
  values (auth.uid(), current_date, 1)
  on conflict (user_id, usage_date)
  do update set request_count = public.gymmi_daily_usage.request_count + 1
  where public.gymmi_daily_usage.request_count < daily_limit
  returning request_count into current_count;

  return current_count is not null and current_count <= daily_limit;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  handle text not null unique,
  bio text not null default '',
  created_at timestamptz not null default now(),
  constraint valid_handle check (handle ~ '^[a-z0-9_]{3,24}$')
);

create table if not exists public.friendships (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references auth.users(id) on delete cascade,
  addressee_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted')),
  created_at timestamptz not null default now(),
  constraint no_self_friend check (requester_id <> addressee_id)
);

create unique index if not exists friendships_unique_pair
  on public.friendships (
    least(requester_id, addressee_id),
    greatest(requester_id, addressee_id)
  );

create table if not exists public.direct_messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references auth.users(id) on delete cascade,
  receiver_id uuid not null references auth.users(id) on delete cascade,
  content text not null check (char_length(content) between 1 and 2000),
  created_at timestamptz not null default now(),
  constraint no_self_message check (sender_id <> receiver_id)
);

create table if not exists public.shared_workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  workout_id uuid references public.workouts(id) on delete set null,
  workout_snapshot jsonb not null,
  caption text not null default '' check (char_length(caption) <= 600),
  created_at timestamptz not null default now()
);

create or replace function public.are_friends(first_user uuid, second_user uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.friendships
    where status = 'accepted'
      and (
        (requester_id = first_user and addressee_id = second_user)
        or
        (requester_id = second_user and addressee_id = first_user)
      )
  );
$$;

create or replace function public.create_profile_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  base_name text;
  safe_handle text;
begin
  base_name := coalesce(
    new.raw_user_meta_data ->> 'full_name',
    split_part(new.email, '@', 1),
    'Athlete'
  );
  safe_handle := left(
    regexp_replace(lower(base_name), '[^a-z0-9]', '', 'g'),
    16
  ) || '_' || left(new.id::text, 5);

  insert into public.profiles (id, display_name, handle, bio)
  values (new.id, base_name, safe_handle, 'Training with GymOS')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists create_gymos_profile on auth.users;
create trigger create_gymos_profile
  after insert on auth.users
  for each row execute function public.create_profile_for_new_user();

insert into public.profiles (id, display_name, handle, bio)
select
  id,
  coalesce(raw_user_meta_data ->> 'full_name', split_part(email, '@', 1), 'Athlete'),
  left(
    regexp_replace(
      lower(coalesce(raw_user_meta_data ->> 'full_name', split_part(email, '@', 1), 'athlete')),
      '[^a-z0-9]',
      '',
      'g'
    ),
    16
  ) || '_' || left(id::text, 5),
  'Training with GymOS'
from auth.users
on conflict (id) do nothing;

alter table public.gymmi_chats enable row level security;
alter table public.gymmi_daily_usage enable row level security;
alter table public.profiles enable row level security;
alter table public.friendships enable row level security;
alter table public.direct_messages enable row level security;
alter table public.shared_workouts enable row level security;

create policy "gymmi_chats_own_rows" on public.gymmi_chats for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "profiles_authenticated_read" on public.profiles for select
  to authenticated using (true);
create policy "profiles_own_insert" on public.profiles for insert
  to authenticated with check (auth.uid() = id);
create policy "profiles_own_update" on public.profiles for update
  to authenticated using (auth.uid() = id) with check (auth.uid() = id);

create policy "friendships_participant_read" on public.friendships for select
  to authenticated
  using (auth.uid() = requester_id or auth.uid() = addressee_id);
create policy "friendships_requester_insert" on public.friendships for insert
  to authenticated
  with check (auth.uid() = requester_id and requester_id <> addressee_id);
create policy "friendships_addressee_accept" on public.friendships for update
  to authenticated
  using (auth.uid() = addressee_id)
  with check (auth.uid() = addressee_id and status = 'accepted');
create policy "friendships_participant_delete" on public.friendships for delete
  to authenticated
  using (auth.uid() = requester_id or auth.uid() = addressee_id);

create policy "messages_friends_read" on public.direct_messages for select
  to authenticated
  using (
    (auth.uid() = sender_id or auth.uid() = receiver_id)
    and public.are_friends(sender_id, receiver_id)
  );
create policy "messages_friends_send" on public.direct_messages for insert
  to authenticated
  with check (
    auth.uid() = sender_id
    and public.are_friends(sender_id, receiver_id)
  );

create policy "shared_workouts_friends_read" on public.shared_workouts for select
  to authenticated
  using (
    auth.uid() = user_id
    or public.are_friends(auth.uid(), user_id)
  );
create policy "shared_workouts_own_insert" on public.shared_workouts for insert
  to authenticated with check (auth.uid() = user_id);
create policy "shared_workouts_own_delete" on public.shared_workouts for delete
  to authenticated using (auth.uid() = user_id);

create index if not exists gymmi_chats_user_updated_idx
  on public.gymmi_chats(user_id, updated_at desc);
create index if not exists direct_messages_pair_created_idx
  on public.direct_messages(sender_id, receiver_id, created_at);
create index if not exists shared_workouts_user_created_idx
  on public.shared_workouts(user_id, created_at desc);

-- Optional realtime support for future live chat subscriptions.
do $$
begin
  alter publication supabase_realtime add table public.direct_messages;
exception
  when duplicate_object then null;
end;
$$;
