-- Phase 3 Schema Migration
-- Stellar accounts, testnet metadata, x402 nonces

-- ─── stellar_accounts ─────────────────────────────────────────
-- Tracks each user's Stellar account info
create table if not exists public.stellar_accounts (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null unique references public.user_profiles(id) on delete cascade,
  public_key          text not null unique,

  -- Funding status (testnet)
  is_funded           boolean not null default false,
  funded_at           timestamptz,

  -- Trustlines established
  usdc_trustline      boolean not null default false,
  eurc_trustline      boolean not null default false,

  -- Environment
  is_testnet          boolean not null default true,
  network_passphrase  text not null default 'Test SDF Network ; September 2015',

  -- Soroban contract IDs for this user's instances
  router_contract_id  text,  -- Phase 3: deployed Router contract
  vault_contract_id   text,  -- Phase 3: deployed Vault contract

  -- Balances (cached, refreshed from Horizon)
  cached_xlm_balance  numeric(18,7) default 0,
  cached_usdc_balance numeric(18,7) default 0,
  cached_eurc_balance numeric(18,7) default 0,
  balances_cached_at  timestamptz,

  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

alter table public.stellar_accounts enable row level security;
create policy "users_own_stellar_accounts" on public.stellar_accounts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ─── x402_nonces ──────────────────────────────────────────────
-- Prevents replay attacks on x402 payment headers
create table if not exists public.x402_nonces (
  id          uuid primary key default gen_random_uuid(),
  nonce       text not null unique,
  user_id     uuid references public.user_profiles(id) on delete set null,
  endpoint    text not null,
  amount_usdc numeric(10,6) not null,
  used_at     timestamptz,
  expires_at  timestamptz not null default (now() + interval '5 minutes'),
  created_at  timestamptz not null default now()
);

alter table public.x402_nonces enable row level security;
-- Only service role can manage nonces (server-side only)
create policy "service_role_manages_nonces" on public.x402_nonces
  for all using (false); -- Client never accesses directly

-- Auto-cleanup expired nonces
create or replace function public.cleanup_expired_nonces()
returns void language sql as $$
  delete from public.x402_nonces where expires_at < now();
$$;

-- ─── onramp_transactions ───────────────────────────────────────
-- Tracks Onramp.money payout transactions for webhook correlation
create table if not exists public.onramp_transactions (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references public.user_profiles(id) on delete cascade,
  onramp_tx_id      text not null unique,
  reference_id      text not null,
  status            text not null default 'pending' check (status in ('pending','processing','completed','failed')),
  usdc_amount       numeric(18,6) not null,
  inr_amount        numeric(18,2),
  exchange_rate     numeric(10,4),
  fee_inr           numeric(10,2),
  recipient         text not null,
  recipient_type    text not null,
  utr_number        text,  -- UPI Transaction Reference (filled by webhook)
  failure_reason    text,
  payment_event_id  uuid references public.payment_events(id),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

alter table public.onramp_transactions enable row level security;
create policy "users_own_onramp_txns" on public.onramp_transactions
  for select using (auth.uid() = user_id);
-- Only service role inserts (webhook handler)
create policy "service_role_writes_onramp" on public.onramp_transactions
  for insert with check (false); -- Client never inserts directly

-- ─── Add stellar_public_key to user_profiles if not exists ────
-- (Already exists from Phase 2, just ensure)
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'user_profiles'
      and column_name = 'stellar_public_key'
  ) then
    alter table public.user_profiles add column stellar_public_key text unique;
  end if;
end $$;
