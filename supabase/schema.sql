-- Run this once in the Supabase SQL editor.
create extension if not exists "pgcrypto";

create table if not exists public.workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  focus text not null,
  exercises jsonb not null default '[]'::jsonb,
  status text not null default 'completed',
  created_at timestamptz not null default now(),
  completed_at timestamptz not null default now(),
  duration_seconds integer not null default 0
);

create table if not exists public.body_weight_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  weight numeric not null check (weight > 0),
  logged_at timestamptz not null default now()
);

create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now(),
  category text not null default 'General',
  pinned boolean not null default false
);

create table if not exists public.workout_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  exercises jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.workouts enable row level security;
alter table public.body_weight_logs enable row level security;
alter table public.notes enable row level security;
alter table public.workout_templates enable row level security;

create policy "workouts_own_rows" on public.workouts for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "weight_logs_own_rows" on public.body_weight_logs for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "notes_own_rows" on public.notes for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "templates_own_rows" on public.workout_templates for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists workouts_user_completed_idx
  on public.workouts(user_id, completed_at desc);
create index if not exists notes_user_created_idx
  on public.notes(user_id, created_at desc);
