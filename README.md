# Delite — Agentic Remittance & Payments OS on Stellar Testnet

> _Next-generation financial OS for freelancers and NRIs. Soroban-powered, AI-routed, fully production-ready._

[![Network](https://img.shields.io/badge/Network-Stellar%20Testnet-blue)](https://stellar.org)
[![Vault Contract](https://img.shields.io/badge/Soroban-Vault%20Contract-purple)](https://stellar.expert/explorer/testnet/contract/CC7Z3ALJMFFI3ICBTLJQGZQTA3XPIWCEOSBO3TMQQD52A3FQFM6VLVYS)
[![Router Contract](https://img.shields.io/badge/Soroban-Router%20Contract-purple)](https://stellar.expert/explorer/testnet/contract/CAKXHCLWKWLETL532QDVC7XHCMUSMMFJCA34IT5SJT2LDTKUMOH6WBRW)

Delite is a **Soroban-powered Agentic Payment OS** deployed on **Stellar Testnet**, architected to automate global income flows using intelligent agents. Connect a Stellar wallet, fund via Friendbot, receive payments, and let the on-chain agent automatically route your funds to daily expenses, family remittances, and yield-generating vaults.

---

## Live Deployment

| Resource             | Value                                                      |
| -------------------- | ---------------------------------------------------------- |
| **Live Demo**        | [https://delite-x-web.vercel.app/](https://delite-x-web.vercel.app/) |
| **Vault Contract**   | `CC7Z3ALJMFFI3ICBTLJQGZQTA3XPIWCEOSBO3TMQQD52A3FQFM6VLVYS` |
| **Router Contract**  | `CAKXHCLWKWLETL532QDVC7XHCMUSMMFJCA34IT5SJT2LDTKUMOH6WBRW` |
| **Network**          | Stellar Testnet                                            |
| **Soroban RPC**      | `https://soroban-testnet.stellar.org`                      |

---

## The Problem & Our Solution

### The Problem
Global workers, freelancers, and NRIs face high fees, slow settlement times, and manual overhead when managing cross-border income. Traditional remittance involves intermediaries, hidden FX spreads, and manual routing of funds for bills, savings, and family support.

### The Solution
Delite is a unified **Agentic Remittance & Payments OS** built on the Stellar network. It provides instant, near-zero fee cross-border settlements with an AI-powered smart router. Users declare their financial goals in plain English (e.g., *"Save 30%, send 20% to family"*), and the AI configures an on-chain Soroban smart contract to autonomously route incoming funds to decentralized yield vaults, family wallets, and bill-pay endpoints.

---

## Features

### User-Facing

- **Autonomous Agent Logic** — Smart contract router instantly splits incoming payments into customizable remittance and savings streams.
- **Yield Generation Vaults** — Idle funds are routed to an ERC-4626 style Soroban vault for automated yield generation.
- **Borderless Global Income** — Settle cross-border payments instantly with near-zero fees using Stellar's decentralized liquidity.
- **Multi-Wallet Support** — Connect seamlessly using the Freighter wallet.
- **Testnet Faucet** — One-click Friendbot funding to get new users onboarded to the testnet instantly.
- **Live On-Chain Data** — Real-time XLM balances and active smart contract positions fetched directly from the Soroban RPC.
- **Progressive UI/UX** — Modern, dynamic dashboard tracking agent allocations and vault yields.

---

## Architecture

```text
 ┌────────────────┐                                ┌──────────────────────────────────────────┐
 │ User Wallet    │ ── (Natural Language) ──▶ │ Delite AI Agent (Nemotron-4-340B)      │
 └────────────────┘                                └──────────────────────────────────────────┘
         │                                                            │ (Generates Allocations)
         ▼                                                            ▼
 ┌────────────────┐      sign tx (XDR)             ┌──────────────────────────────────────────┐
 │ Stellar Wallet │ ◀───────────────────────────── │ Next.js Dashboard (Frontend OS)        │
 │ (Freighter)    │ ── signed XDR ───────────────▶ │ /dashboard · /ai-agent · /rules        │
 └────────────────┘                                └──────────┬───────────────────────────────┘
                                                              │ Horizon / Soroban RPC
                                                              ▼
                                                   ┌──────────────────────────────────────────┐
                                                   │ Soroban Smart Contract Router            │
                                                   │ (Trustless, On-chain Execution)          │
                                                   └──────────┬──────────────────────┬────────┘
                                                              │                      │
                                                              ▼                      ▼
                                            ┌──────────────────────┐      ┌──────────────────────┐
                                            │ Family / Remittance  │      │ Soroban DeFi Vault   │
                                            │ (Instant Settlement) │      │ (Yield Generation)   │
                                            └──────────────────────┘      └──────────────────────┘
```

---

## Project Structure

```text
DeliteX/
├── apps/
│   └── web/                       # Next.js 14 App Router (Frontend & API)
│       ├── public/Screenshots/    # Application screenshots & assets
│       ├── src/app/               # App Router pages (Dashboard, Login) & API routes
│       ├── src/components/        # React components (AiAssistant, RulesEditor, Vault)
│       ├── src/hooks/             # Global state (DashboardContext, useDashboardData)
│       └── src/lib/ai/            # AI intent parsing & NVIDIA NIM integrations
│
├── packages/
│   ├── contracts/                 # Rust Soroban smart contracts
│   │   ├── router/                # On-chain payment splitting and allocation logic
│   │   ├── vault/                 # ERC-4626 style yield-generation vault
│   │   └── scripts/               # Testnet deployment automation (`deploy.js`)
│   │
│   ├── ui/                        # Shared UI components and design system
│   ├── config-eslint/             # Monorepo ESLint configurations
│   └── config-typescript/         # Monorepo TypeScript configurations
│
├── supabase/                      # Database migrations & schema definitions
├── .github/workflows/             # CI/CD pipelines (Lint, Build, Deploy)
├── package.json                   # Turborepo root configuration
└── pnpm-workspace.yaml            # PNPM workspace definition
```

---

## Environment Variables

| Variable                       | Required | Default | Description                                                |
| ------------------------------ | -------- | ------- | ---------------------------------------------------------- |
| `NEXT_PUBLIC_SOROBAN_VAULT`    | Yes      | `""`    | Deployed Vault contract ID on Stellar Testnet              |
| `NEXT_PUBLIC_SOROBAN_ROUTER`   | Yes      | `""`    | Deployed Router contract ID on Stellar Testnet             |

---

## Setup

### Prerequisites

- Node 18+ with `pnpm`
- Rust + `wasm32-unknown-unknown` target
- A Stellar wallet extension (Freighter recommended)

### Quick Start

```bash
# Clone and install dependencies
git clone https://github.com/fizxy7619/DeliteX.git
cd DeliteX
pnpm install

# (Optional) Deploy the Soroban contracts to Testnet
cd packages/contracts
pnpm run build
node scripts/deploy.js
cd ../../

# Start dev server
pnpm dev
```
Open `http://localhost:3000` with your browser to experience the Delite OS.

---

## Screenshots

### Landing Page
![Landing Page](apps/web/public/Screenshots/Landing%20Page.png)
*The modern, glassmorphic entry point into the Delite ecosystem.*

### Dashboard
![Dashboard](apps/web/public/Screenshots/Dashbaord.png)
*The central hub to monitor your Stellar Testnet XLM balance, active smart contract positions, and incoming payment events.*

### Agentic AI
![Agentic AI](apps/web/public/Screenshots/Agentic%20Ai.png)
*Our AI agent, powered by NVIDIA Nemotron-4-340B, translates plain English financial goals into structured smart-contract allocation rules.*

### Family & Remittance
![Family & Remittance](apps/web/public/Screenshots/Family%20&%20Remitance.png)
*Manage global recipients and simulate cross-border fund routing instantly via the Soroban Router.*

### CI/CD Pipeline
![CI CD Pipeline](apps/web/public/Screenshots/CI%20CD%20Pipeline.png)
*Automated Turborepo workflows ensuring type-safety, linting, and rapid deployment on every commit.*

---

## Deployed Contract Information

- **Live Demo Link:** [https://delite-x-web.vercel.app/](https://delite-x-web.vercel.app/)
- **Vault Contract Address:** `CC7Z3ALJMFFI3ICBTLJQGZQTA3XPIWCEOSBO3TMQQD52A3FQFM6VLVYS`
- **Router Contract Address:** `CAKXHCLWKWLETL532QDVC7XHCMUSMMFJCA34IT5SJT2LDTKUMOH6WBRW`
- **Network:** Stellar Testnet
- **Soroban RPC URL:** `https://soroban-testnet.stellar.org`

---

## Roadmap

| Level | Feature                                                           | Status    |
| ----- | ----------------------------------------------------------------- | --------- |
| L1    | Freighter Wallet connect, friendbot funding, XLM transfers        | ✅ Done   |
| L2    | Full Soroban vault contract (yield generation) natively deployed  | ✅ Done   |
| L3    | Agentic router contract for automated multi-stream allocations    | ✅ Done   |
| L4    | Full Mainnet launch and fiat on-ramp integration                  | 🔜 Next   |

---

## Disclaimer

Testnet only. Not financial advice. Real token state lives on-chain via the deployed Soroban smart contracts on the Stellar Testnet.
