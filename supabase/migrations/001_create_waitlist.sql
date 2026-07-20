-- ============================================================
-- DeliteX: Waitlist table
-- Run this in the Supabase SQL Editor to create the table.
-- ============================================================

create table if not exists public.waitlist (
  id          uuid primary key default gen_random_uuid(),
  email       text not null unique,
  name        text,
  source      text default 'landing_page',
  created_at  timestamptz not null default now()
);

-- Index for fast email lookups
create unique index if not exists waitlist_email_idx on public.waitlist (lower(email));

-- Enable Row Level Security
alter table public.waitlist enable row level security;

-- IMPORTANT: Only the service_role key (server-side) can insert.
-- The anon key CANNOT read or write the waitlist directly.
create policy "service_role_only" on public.waitlist
  as restrictive
  for all
  using (false)
  with check (false);
