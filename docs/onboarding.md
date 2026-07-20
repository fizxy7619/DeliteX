# Developer Onboarding

Welcome to DeliteX! This guide gets you from zero to running the full stack locally in under 10 minutes.

## Prerequisites

- **Node.js** ≥ 22 (`node --version`)
- **pnpm** ≥ 9 (`npm install -g pnpm`)
- A **Supabase** project ([supabase.com](https://supabase.com) — free tier works)
- An **NVIDIA NIM** API key ([build.nvidia.com](https://build.nvidia.com) — free credits)

---

## 1. Clone & Install

```bash
git clone https://github.com/fizxy7619/DeliteX
cd DeliteX
pnpm install
```

---

## 2. Configure Environment

```bash
cp apps/web/.env.example apps/web/.env.local
```

Edit `apps/web/.env.local`:

```env
# ── Supabase ──────────────────────────────────────
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# ── NVIDIA NIM (AI) ───────────────────────────────
# Get free key at: https://build.nvidia.com
NVIDIA_API_KEY=nvapi-...

# ── Feature flags (leave as-is for local dev) ─────
NEXT_PUBLIC_DEMO_MODE=false
ONRAMP_STUB_MODE=true
X402_STUB_MODE=true
```

### Finding your Supabase keys
1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. Select your project → **Project Settings → API**
3. Copy **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
4. Copy **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Copy **service_role** key → `SUPABASE_SERVICE_ROLE_KEY`

---

## 3. Run Database Migrations

From the project root, run each migration in order:

```bash
# Using Node.js (requires pg package)
node -e "
const { Client } = require('pg');
const fs = require('fs');
const client = new Client({ connectionString: 'postgresql://postgres:PASSWORD@db.YOUR_PROJECT.supabase.co:5432/postgres' });
client.connect()
  .then(() => client.query(fs.readFileSync('supabase/migrations/001_create_waitlist.sql', 'utf8')))
  .then(() => client.query(fs.readFileSync('supabase/migrations/002_core_tables.sql', 'utf8')))
  .then(() => client.query(fs.readFileSync('supabase/migrations/003_x402_nonces.sql', 'utf8')))
  .then(() => client.query(fs.readFileSync('supabase/migrations/004_agent_decisions.sql', 'utf8')))
  .then(() => client.query(fs.readFileSync('supabase/migrations/005_vault_positions.sql', 'utf8')))
  .then(() => { console.log('All migrations applied!'); client.end(); })
  .catch(e => { console.error(e.message); client.end(); });
"
```

> Or use the **Supabase SQL Editor** in the dashboard to paste and run each file manually.

---

## 4. Run the Dev Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## 5. Project Layout

```
apps/web/src/
├── app/
│   ├── api/           # API route handlers
│   │   ├── ai/        # LLM intent parsing, proposals, approvals
│   │   ├── vault/     # Soroban vault deposit/withdraw
│   │   ├── stellar/   # Stellar account & payment queries
│   │   ├── x402/      # x402 bill payment
│   │   └── onramp/    # Onramp.money INR conversion
│   ├── app/           # /app route (authenticated dashboard)
│   ├── auth/          # Supabase auth callback
│   └── login/         # Login page
├── components/
│   ├── dashboard/     # All dashboard views & panels
│   └── (landing)/     # Landing page sections
├── lib/
│   ├── ai/            # NVIDIA NIM provider, intent parser, agent engine
│   ├── vault/         # Soroban vault connector
│   ├── stellar/       # Stellar SDK wrappers
│   └── x402/          # x402 protocol implementation
└── types/
    └── domain.ts      # Shared TypeScript interfaces
```

---

## 6. Running Tests

```bash
pnpm test
```

> Tests are minimal in early phases. Expand `/tests` as you add features.

---

## 7. Demo Mode

To enable the investor demo banner and pre-populated mock data:

```env
NEXT_PUBLIC_DEMO_MODE=true
```

Then navigate to `/demo` for a public, no-login walkthrough.

---

## 8. Common Issues

| Problem | Fix |
|---------|-----|
| `Missing Supabase server environment variables` | Check `.env.local` is present and correctly filled |
| `NVIDIA NIM 401 Unauthorized` | Check `NVIDIA_API_KEY` is valid — get one at build.nvidia.com |
| Build fails on CI | The CI uses dummy env vars. Make sure env guards use `??` not `!` |
| Stellar account not found | Account needs to be funded via [testnet friendbot](https://friendbot.stellar.org) |
