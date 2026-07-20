# DeliteX — Agent Continuation Guide

> For any AI agent resuming this project: Read this completely first.

## 1. Project
DeliteX — Agentic Remittance OS for Indian freelancers/NRIs
Stack: Next.js 16 (App Router) · Supabase · Stellar/Soroban · Onramp.money · x402
Repo: d:\Delite | Main app: d:\Delite\apps\web

## 2. Credentials (in apps/web/.env.local)
- Supabase URL: https://gjplhxapivuviejlsurj.supabase.co
- Stellar: TESTNET, Horizon: https://horizon-testnet.stellar.org

## 3. Completed Phases
- Phase 0: Monorepo (pnpm + Turborepo)
- Phase 1: Landing page + waitlist (migration 001 applied)
- Phase 2: Dashboard, auth, all sections, domain model (migration 002 applied)
- Phase 3 (partial): Stellar SDK, account service, payment stream, Soroban interfaces, x402 stub, Onramp stub, StellarView component (migration 003 applied)

## 4. Remaining Phase 3 Work

### 4A. Fix TypeScript Errors (DO FIRST)
Run: cd d:\Delite\apps\web; npx tsc --noEmit
Fix any type issues in src/lib/stellar/accounts.ts or payments.ts

### 4B. Non-Custodial Wallet Flow
In StellarView.tsx: add Freighter wallet connection:
  pnpm add @stellar/freighter-api
  Add "Connect Freighter" button using isConnected() + getPublicKey()
  POST public key to new API endpoint PUT /api/stellar/account

### 4C. Real Payment Streaming
Create GET /api/stellar/stream (SSE route) using watchPayments() from lib/stellar/payments.ts
In StellarView: subscribe with EventSource, update balances in real time

### 4D. Soroban Contracts
- Install Stellar CLI
- Write contracts in packages/contracts/router/src/lib.rs
- Deploy to testnet, store ID in NEXT_PUBLIC_SOROBAN_ROUTER env
- Generate TS bindings: stellar contract bindings typescript
- Replace RouterContractStub in src/lib/stellar/contracts.ts

### 4E. Real Onramp.money
- Set STUB_MODE = false in src/lib/onramp/connector.ts
- Get API keys from onramp.money
- Create webhook handler: /api/onramp/webhook

### 4F. Real x402 Verification
- In src/lib/x402/protocol.ts verifyPaymentHeader(): parse XDR, submit to Horizon
- Verify: destination, amount, memo, nonce anti-replay via x402_nonces table

## 5. Phase 4 — LLM AI Agent
- Create /api/ai/parse-intent (POST): calls GPT-4o/Gemini with structured output
- Schema: { intent, bucket, percent, billId, amount }
- Replace keyword stub in AiAssistantStub.tsx
- Create /api/ai/apply-rule to persist confirmed rules

## 6. Key Files
- Domain types: src/types/domain.ts
- Mock data: src/lib/mock-data.ts
- Stellar config: src/lib/stellar/config.ts
- Stellar accounts: src/lib/stellar/accounts.ts
- Stellar payments: src/lib/stellar/payments.ts
- Soroban contracts: src/lib/stellar/contracts.ts
- Onramp connector: src/lib/onramp/connector.ts
- x402 protocol: src/lib/x402/protocol.ts
- Stellar dashboard: src/components/dashboard/StellarView.tsx
- Auth middleware: src/proxy.ts
- DB migrations: supabase/migrations/ (001, 002, 003 all applied)

## 7. Design Rules (NEVER BREAK)
- No gradients. Flat only.
- Palette: #F8F7F4 bg, Saffron #E8872A CTAs, Jade #2B7A5A success
- Fonts: Instrument Serif (display) + DM Sans (body)
- No onMouseEnter/onMouseLeave on Server Components

## 8. Commands
Dev server: cd d:\Delite\apps\web; pnpm run dev
Add package: cd d:\Delite\apps\web; pnpm add <pkg>
Type check: cd d:\Delite\apps\web; npx tsc --noEmit

## 9. First Task for Resuming Agent
1. pnpm run dev
2. npx tsc --noEmit — fix any TS errors
3. Open /app, sign up, go to Stellar tab
4. Test Friendbot funding + balance display
5. Then implement 4B (Freighter wallet)
