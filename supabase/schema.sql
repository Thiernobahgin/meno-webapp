-- MENO — Supabase schema
-- Run this once in your Supabase project's SQL editor (Project → SQL Editor → New query).
-- Safe to re-run: uses "if not exists" / "or replace" / "add column if not exists" everywhere it can,
-- so re-running it against a project that already has data (like this one) only adds what's missing.

-- ============================================================
-- PROFILES  (one row per user, id = auth.users.id)
-- ============================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text default '',
  stage text default '',
  symptoms text[] default '{}',
  goals text[] default '{}',
  onboarded boolean not null default false,
  appointment_date date,
  appointment_time text,
  stripe_customer_id text,
  subscription_status text not null default 'free',   -- 'free' | 'active' | 'past_due' | 'canceled'
  subscription_period text,                            -- 'month' | 'year'
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- MENO is now a fully paid product: these two columns support a short grace
-- period after a failed renewal charge, and let the UI show "your plan ends
-- on <date>" instead of cutting access the moment someone cancels.
alter table public.profiles add column if not exists cancel_at_period_end boolean not null default false;
alter table public.profiles add column if not exists grace_period_ends_at timestamptz;
-- Timestamp of the last Stripe event actually applied to this row, so a
-- redelivered/out-of-order webhook can never overwrite newer state with older.
alter table public.profiles add column if not exists subscription_event_at timestamptz;

alter table public.profiles enable row level security;

drop policy if exists "profiles: read own" on public.profiles;
create policy "profiles: read own" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles: insert own" on public.profiles;
create policy "profiles: insert own" on public.profiles
  for insert with check (auth.uid() = id);

drop policy if exists "profiles: update own" on public.profiles;
create policy "profiles: update own" on public.profiles
  for update using (auth.uid() = id);

-- Auto-create an empty profile row the moment someone signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id) values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- True if this user currently has paid access: an active subscription, or a
-- past_due one still inside its grace period. Used by the RLS policies below
-- so a lapsed subscriber can't read or write their check-ins/plan/questions
-- by calling the Supabase API directly, even if they bypass the app's UI.
create or replace function public.is_subscribed(uid uuid)
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = uid
      and (
        p.subscription_status = 'active'
        or (p.subscription_status = 'past_due' and p.grace_period_ends_at is not null and p.grace_period_ends_at > now())
      )
  );
$$;

-- ============================================================
-- CHECK-INS  (one row per user per day)
-- ============================================================
create table if not exists public.checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  hot_flashes int,
  night_sweats int,
  brain_fog int,
  fatigue int,
  anxiety int,
  mood int,
  headaches int,
  joint_pain int,
  libido int,
  vaginal_dryness int,
  weight_changes int,
  sleep int,
  period_today boolean,
  note text default '',
  updated_at timestamptz not null default now(),
  unique (user_id, date)
);

-- Personalized daily check-in: one nullable severity column per symptom a
-- user can select at onboarding, added to whatever existing installs already had.
alter table public.checkins add column if not exists fatigue int;
alter table public.checkins add column if not exists anxiety int;
alter table public.checkins add column if not exists mood int;
alter table public.checkins add column if not exists headaches int;
alter table public.checkins add column if not exists joint_pain int;
alter table public.checkins add column if not exists libido int;
alter table public.checkins add column if not exists vaginal_dryness int;
alter table public.checkins add column if not exists weight_changes int;

alter table public.checkins enable row level security;

drop policy if exists "checkins: all own" on public.checkins;
create policy "checkins: all own" on public.checkins
  for all
  using (auth.uid() = user_id and public.is_subscribed(auth.uid()))
  with check (auth.uid() = user_id and public.is_subscribed(auth.uid()));

create index if not exists checkins_user_date_idx on public.checkins (user_id, date);

-- ============================================================
-- PLAN ITEMS  (medications / lifestyle changes being tracked)
-- ============================================================
create table if not exists public.plan_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  type text not null default 'lifestyle',  -- 'medication' | 'lifestyle'
  started_date date not null default current_date,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.plan_items enable row level security;

drop policy if exists "plan_items: all own" on public.plan_items;
create policy "plan_items: all own" on public.plan_items
  for all
  using (auth.uid() = user_id and public.is_subscribed(auth.uid()))
  with check (auth.uid() = user_id and public.is_subscribed(auth.uid()));

-- ============================================================
-- QUESTIONS  (things to ask the doctor)
-- ============================================================
create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  text text not null,
  done boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.questions enable row level security;

drop policy if exists "questions: all own" on public.questions;
create policy "questions: all own" on public.questions
  for all
  using (auth.uid() = user_id and public.is_subscribed(auth.uid()))
  with check (auth.uid() = user_id and public.is_subscribed(auth.uid()));

-- ============================================================
-- STRIPE EVENTS  (webhook idempotency — service role only, no RLS needed)
-- ============================================================
create table if not exists public.stripe_events (
  id text primary key,
  type text,
  created_at timestamptz not null default now()
);
