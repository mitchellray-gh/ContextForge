-- 0001_init.sql
-- ContextForge initial schema + Row Level Security.
--
-- The three CREATE TABLE statements are reproduced verbatim from
-- CONTEXTFORGE_SPEC.md §3. Everything below them enables RLS and adds policies
-- so each authenticated user can only read/write their own rows.

-- Required for uuid_generate_v4() used by the spec schema below.
create extension if not exists "uuid-ossp";

-- ---------------------------------------------------------------------------
-- Tables (verbatim from spec §3)
-- ---------------------------------------------------------------------------

-- Table: profiles (companion to Supabase Auth's auth.users)
create table profiles (
  id uuid references auth.users not null primary key,
  email text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Table: data_sources
create table data_sources (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) not null,
  source_type text not null check (source_type in ('github', 'notion', 'url_scrape', 'raw_text')),
  source_uri text not null,
  metadata jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Table: context_packs
create table context_packs (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) not null,
  source_id uuid references data_sources(id) on delete cascade,
  title text not null,
  token_count integer default 0,
  raw_content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ---------------------------------------------------------------------------
-- Row Level Security: enable on every table, then scope by owner.
-- `(select auth.uid())` is wrapped in a subquery so Postgres caches it per
-- statement (the Supabase-recommended performant pattern).
-- ---------------------------------------------------------------------------

alter table profiles enable row level security;
alter table data_sources enable row level security;
alter table context_packs enable row level security;

-- profiles ------------------------------------------------------------------
create policy "Profiles are viewable by owner"
  on profiles for select
  using ((select auth.uid()) = id);

create policy "Users can insert their own profile"
  on profiles for insert
  with check ((select auth.uid()) = id);

create policy "Users can update their own profile"
  on profiles for update
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- data_sources --------------------------------------------------------------
create policy "Data sources are selectable by owner"
  on data_sources for select
  using ((select auth.uid()) = user_id);

create policy "Data sources are insertable by owner"
  on data_sources for insert
  with check ((select auth.uid()) = user_id);

create policy "Data sources are updatable by owner"
  on data_sources for update
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Data sources are deletable by owner"
  on data_sources for delete
  using ((select auth.uid()) = user_id);

-- context_packs -------------------------------------------------------------
create policy "Context packs are selectable by owner"
  on context_packs for select
  using ((select auth.uid()) = user_id);

create policy "Context packs are insertable by owner"
  on context_packs for insert
  with check ((select auth.uid()) = user_id);

create policy "Context packs are updatable by owner"
  on context_packs for update
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Context packs are deletable by owner"
  on context_packs for delete
  using ((select auth.uid()) = user_id);

-- ---------------------------------------------------------------------------
-- Auto-provision a profile row on signup.
-- The foreign keys above (data_sources.user_id / context_packs.user_id ->
-- profiles.id) require a matching profile to exist before any row can be
-- inserted, so this trigger is required for the §3 schema to be usable.
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
