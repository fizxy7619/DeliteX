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
| **Live Demo**        | *(Add your live deployment link here)*                     |
| **Vault Contract**   | `CC7Z3ALJMFFI3ICBTLJQGZQTA3XPIWCEOSBO3TMQQD52A3FQFM6VLVYS` |
| **Router Contract**  | `CAKXHCLWKWLETL532QDVC7XHCMUSMMFJCA34IT5SJT2LDTKUMOH6WBRW` |
| **Network**          | Stellar Testnet                                            |
| **Soroban RPC**      | `https://soroban-testnet.stellar.org`                      |

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
 ┌────────────────┐   sign tx (XDR)    ┌──────────────────────────────────┐
 │ Stellar wallet │ ◀───────────────── │  Delite web app (Next.js)        │
 │ (Freighter)    │ ─signed XDR──────▶ │  /dashboard · /allocations       │
 └────────────────┘                    └──────────┬───────────────────────┘
                                                  │ Horizon / Soroban RPC
                                                  ▼
                                       ┌──────────────────────┐
                                       │  Soroban Router      │
                                       │  (Agentic splits)    │
                                       └──────────┬───────────┘
                                                  ▼
                                       ┌──────────────────────┐
                                       │  Soroban Vault       │
                                       │  (Yield Generation)  │
                                       └──────────────────────┘
```

---

## Project Structure

```text
delite/
├── apps/
│   └── web/                   Next.js App Router frontend
│       ├── src/app/           Pages and API routes
│       └── src/components/    React components (Dashboard, StellarView)
│
├── packages/
│   ├── contracts/             Rust Soroban contracts
│   │   ├── router/            Agent allocation logic
│   │   ├── vault/             Yield generation vault
│   │   └── scripts/           Testnet deployment pipeline (`deploy.js`)
│   │
│   ├── ui/                    Shared shadcn/ui React components
│   ├── config-eslint/         Monorepo linting rules
│   └── config-typescript/     Monorepo TS configs
│
├── .env.example               Environment variable template
├── package.json               Turborepo root config
└── pnpm-workspace.yaml
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

*(Replace the placeholders below with actual screenshots of your application)*

### Dashboard
![Dashboard](docs/screenshots/Dashboard.png)

Shows the main Delite dashboard, wallet connection, and testnet XLM balance.

### Agent Allocation Flow
![Allocation Success](docs/screenshots/Allocation.png)

Triggering the smart contract router to split incoming payments.

### Transaction Hash
![Transaction Hash](docs/screenshots/Transaction.png)

A crop of the transaction hash details as shown after a smart contract execution.

---

## Deployed Contract Information

- **Live Demo Link:** *(Your live deployment URL)*
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
