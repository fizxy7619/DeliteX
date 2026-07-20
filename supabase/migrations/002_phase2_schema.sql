-- ============================================================
-- DeliteX Phase 2 — Full Schema Migration
-- Run in Supabase SQL Editor
-- ============================================================

-- Enable UUID extension (usually already enabled in Supabase)
create extension if not exists "uuid-ossp";

-- ─── user_profiles ──────────────────────────────────────────
create table if not exists public.user_profiles (
  id                    uuid primary key references auth.users(id) on delete cascade,
  full_name             text,
  avatar_url            text,
  kyc_status            text not null default 'none' check (kyc_status in ('none','pending','approved','rejected')),
  stellar_public_key    text unique,
  inr_payout_type       text check (inr_payout_type in ('upi','bank_account')),
  inr_payout_identifier text,
  inr_payout_label      text,
  inr_payout_verified   boolean default false,
  notify_on_incoming    boolean default true,
  notify_on_payout      boolean default true,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

alter table public.user_profiles enable row level security;
create policy "users_own_profile" on public.user_profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.user_profiles (id, full_name, avatar_url)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─── payment_events ──────────────────────────────────────────
create table if not exists public.payment_events (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references public.user_profiles(id) on delete cascade,
  direction           text not null check (direction in ('incoming','outgoing')),
  bucket              text not null check (bucket in ('income','bills','family','savings')),
  status              text not null default 'pending' check (status in ('pending','completed','failed','processing')),
  amount              numeric(18,6) not null,
  currency            text not null,
  inr_equivalent      numeric(18,2),
  fx_rate             numeric(18,6),
  fx_spread_percent   numeric(6,4),
  counterparty        text,
  description         text not null,
  rail                text not null check (rail in ('stellar','upi','neft','imps','swift')),
  stellar_tx_hash     text,
  stellar_ledger      bigint,
  soroban_contract_id text,
  settled_at          timestamptz,
  created_at          timestamptz not null default now()
);

alter table public.payment_events enable row level security;
create policy "users_own_events" on public.payment_events
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists payment_events_user_id_idx on public.payment_events(user_id, created_at desc);

-- ─── bills ───────────────────────────────────────────────────
create table if not exists public.bills (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references public.user_profiles(id) on delete cascade,
  name                text not null,
  payee               text not null,
  payee_type          text not null check (payee_type in ('upi','bank_account','wallet')),
  amount              numeric(18,2) not null,
  currency            text not null default 'INR',
  frequency           text not null check (frequency in ('monthly','weekly','quarterly','yearly','one_time')),
  due_day_of_month    int check (due_day_of_month between 1 and 31),
  next_due_date       date not null,
  is_paused           boolean not null default false,
  is_autopay_enabled  boolean not null default false,
  last_paid_at        timestamptz,
  last_paid_amount    numeric(18,2),
  notes               text,
  created_at          timestamptz not null default now()
);

alter table public.bills enable row level security;
create policy "users_own_bills" on public.bills
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ─── family_recipients ────────────────────────────────────────
create table if not exists public.family_recipients (
  id                      uuid primary key default gen_random_uuid(),
  user_id                 uuid not null references public.user_profiles(id) on delete cascade,
  name                    text not null,
  relationship            text not null,
  avatar_initials         text not null,
  payee_type              text not null check (payee_type in ('upi','bank_account')),
  payee_identifier        text not null,
  payee_label             text not null,
  monthly_allowance       numeric(18,2),
  allowance_enabled       boolean not null default false,
  last_transfer_amount    numeric(18,2),
  last_transfer_at        timestamptz,
  total_transferred_inr   numeric(18,2) not null default 0,
  notes                   text,
  created_at              timestamptz not null default now()
);

alter table public.family_recipients enable row level security;
create policy "users_own_family" on public.family_recipients
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ─── allocation_rules ─────────────────────────────────────────
create table if not exists public.allocation_rules (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null references public.user_profiles(id) on delete cascade,
  name                  text not null,
  income_source_filter  text,
  allocations           jsonb not null default '[]',
  is_active             boolean not null default true,
  ai_generated          boolean not null default false,
  ai_prompt             text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

alter table public.allocation_rules enable row level security;
create policy "users_own_rules" on public.allocation_rules
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ─── savings_vaults ───────────────────────────────────────────
create table if not exists public.savings_vaults (
  id                          uuid primary key default gen_random_uuid(),
  user_id                     uuid not null unique references public.user_profiles(id) on delete cascade,
  principal_usdc              numeric(18,6) not null default 0,
  total_value_usdc            numeric(18,6) not null default 0,
  yield_earned_usdc           numeric(18,6) not null default 0,
  estimated_apy_percent       numeric(6,3) not null default 0,
  soroban_contract_id         text,
  vault_shares_held           numeric(30,10),
  auto_deposit_threshold_inr  numeric(18,2),
  auto_deposit_enabled        boolean not null default false,
  last_yield_claimed_at       timestamptz,
  updated_at                  timestamptz not null default now()
);

alter table public.savings_vaults enable row level security;
create policy "users_own_vault" on public.savings_vaults
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ─── ai_chat_messages ─────────────────────────────────────────
create table if not exists public.ai_chat_messages (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.user_profiles(id) on delete cascade,
  role            text not null check (role in ('user','assistant','system')),
  content         text not null,
  parsed_rule     jsonb,
  llm_model       text,
  llm_latency_ms  int,
  created_at      timestamptz not null default now()
);

alter table public.ai_chat_messages enable row level security;
create policy "users_own_messages" on public.ai_chat_messages
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
