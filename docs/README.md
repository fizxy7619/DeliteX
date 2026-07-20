# DeliteX — Agentic Remittance & Payments OS

> **An AI-powered financial operating system for Indian freelancers and remote workers earning in USD, USDC, and EUR.**

[![CI](https://github.com/fizxy7619/DeliteX/actions/workflows/ci.yml/badge.svg)](https://github.com/fizxy7619/DeliteX/actions/workflows/ci.yml)
[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org)
[![Stellar](https://img.shields.io/badge/Stellar-Testnet-blue)](https://stellar.org)
[![Supabase](https://img.shields.io/badge/Supabase-Auth%20%2B%20DB-green)](https://supabase.com)

---

## The Problem

India has ~15 million freelancers and remote workers earning in foreign currency. They face:

- **High fees**: Banks and traditional remittance providers charge 1.5–4% per transfer.
- **Slow settlement**: Wire transfers take 2–5 business days.
- **Fragmented workflows**: Separate apps for receiving payments, paying bills, sending money to family, and savings — none of them talk to each other.
- **Zero intelligence**: No system automatically allocates income across obligations based on rules.

## Our Solution

DeliteX is a single **agentic OS** that:

1. **Receives USD/USDC** via Stellar blockchain (instant, ~0.2% effective cost).
2. **AI Agent (NVIDIA Nemotron)** reads your rules and automatically proposes how to split each incoming payment — rent, family allowances, savings.
3. **You approve** with one click. The agent executes: pays bills via UPI (x402 protocol), sends family remittances via Onramp.money, and deposits surplus into a Soroban yield vault.
4. **Conservative yield** on idle funds via Soroban smart contracts (~5–10% APY on testnet).

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 (App Router, Turbopack) |
| Styling | Vanilla CSS with design tokens |
| Auth | Supabase Auth (magic link + OAuth) |
| Database | Supabase Postgres (RLS-enabled) |
| AI | NVIDIA Nemotron-3-Super-120B via NIM API |
| Blockchain | Stellar Testnet + Soroban smart contracts |
| Payments | x402 protocol (agentic micropayments) |
| On/Off-Ramp | Onramp.money (INR ↔ USDC) |
| CI/CD | GitHub Actions → Vercel |

---

## Quick Start

See [docs/onboarding.md](./onboarding.md) for full setup instructions.

```bash
git clone https://github.com/fizxy7619/DeliteX
pnpm install
cp apps/web/.env.example apps/web/.env.local
# Fill in NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, NVIDIA_API_KEY
pnpm dev
```

---

## Project Structure

```
DeliteX/
├── apps/
│   └── web/               # Next.js app
│       ├── src/
│       │   ├── app/       # Routes (dashboard, auth, APIs)
│       │   ├── components/# UI components
│       │   ├── lib/       # Business logic (AI, Stellar, vault, x402)
│       │   └── types/     # Shared TypeScript types
│       └── supabase/
│           └── migrations/# DB schema
├── packages/
│   ├── contracts/         # Soroban smart contracts (Rust — Phase 5)
│   └── ui/               # Shared UI primitives
└── docs/                 # This directory
```

---

## Phase Roadmap

| Phase | Description | Status |
|---|---|---|
| 0 | Project setup, monorepo, CI/CD | ✅ Complete |
| 1 | Landing page, waitlist | ✅ Complete |
| 2 | Dashboard UI, mock data, design system | ✅ Complete |
| 3 | Stellar testnet accounts, x402 stubs, Onramp stubs | ✅ Complete |
| 4 | AI agent (NVIDIA Nemotron), decision engine, approval flow | ✅ Complete |
| 5 | Yield vault (Soroban), UX polish, accessibility | ✅ Complete |
| 6 | Documentation, investor demo mode | ✅ Complete |
| 7 | Production APIs (real Onramp, real x402), mainnet Stellar | 🔜 Planned |
| 8 | Mobile app (React Native) | 🔜 Planned |

---

## Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# NVIDIA NIM (AI)
NVIDIA_API_KEY=nvapi-...

# Feature flags
NEXT_PUBLIC_DEMO_MODE=false   # set true for investor demo
ONRAMP_STUB_MODE=true         # set false for production
X402_STUB_MODE=true           # set false for production
```

---

## Contributing

1. Fork, create a feature branch: `git checkout -b feat/my-feature`
2. Commit: `git commit -m 'feat: add my feature'`
3. Push and open a PR against `main`.
4. CI must pass (lint + build) before merge.
