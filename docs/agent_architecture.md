# DeliteX Agent Architecture

## Overview

The DeliteX AI Agent is an **automation-first, safety-second** finance assistant. It uses NVIDIA Nemotron-4-340B (via NIM API) to parse natural language into structured intents, and a deterministic rule engine to generate payment proposals. The LLM **never directly moves money** — all executions require human approval.

---

## Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        USER                                 │
│  "Allocate 30% to savings, 40% to bills, rest to family"   │
└──────────────────────┬──────────────────────────────────────┘
                       │ POST /api/ai/parse-intent
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              NVIDIA Nemotron-4-340B (NIM API)               │
│  Input: user text + system prompt (DeliteX domain context) │
│  Output: ParsedIntent JSON                                  │
│  {intent:"set_allocation", allocations:[...], confidence}  │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│             AI ASSISTANT UI (AiAssistant.tsx)               │
│  Shows ParsedIntent as a "Proposed Rule" card              │
│  User clicks "Apply" → POST /api/ai/apply-rule             │
│  AllocationRule saved to Supabase                          │
└─────────────────────────────────────────────────────────────┘

   [Later: payment arrives on Stellar Testnet]
                       │
                       ▼ POST /api/ai/propose
┌─────────────────────────────────────────────────────────────┐
│              AGENT ENGINE (agent-engine.ts)                 │
│  Reads: AllocationRule from DB                             │
│  Reads: Bills (upcoming due dates)                        │
│  Reads: FamilyRecipient allowances                        │
│  Computes: Per-bucket line items                          │
│  Output: AgentProposal (never touches money)              │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│          AgentDecisionPanel (UI — requires approval)        │
│  Shows: line items per bucket with amounts + descriptions  │
│  User clicks "Approve & Execute"                          │
└──────────────────────┬──────────────────────────────────────┘
                       │ POST /api/ai/approve
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              EXECUTOR (executor.ts)                         │
│  Bills  → POST /api/x402/pay-bill (x402 protocol)         │
│  Family → POST /api/onramp/convert (Onramp.money stub)    │
│  Savings→ Vault deposit (Soroban contract stub)           │
│  Income → Held in Stellar wallet (no action)              │
│  Records: agent_decision_items rows with tx hashes        │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│         AgentHistoryView (Decision Log)                     │
│  Timestamped, immutable record of every decision + outcome │
└─────────────────────────────────────────────────────────────┘
```

---

## Safeguards & Limits

| Safeguard | Implementation |
|---|---|
| LLM never executes | `parseIntent()` returns data only. Execution requires a separate `approve` call |
| Human approval required | `POST /api/ai/approve` is only called from the UI after user clicks "Approve & Execute" |
| Immutable audit trail | All decisions + items persisted to `agent_decisions` / `agent_decision_items` |
| Anti-replay protection | x402 nonces tracked in `x402_nonces` table |
| No real money in Phase 4 | `executor.ts` uses mock 300–700ms delays. Real APIs are toggled via `STUB_MODE` env vars |
| Rate limiting | `/api/ai/parse-intent` is gated behind auth. LLM errors fall back gracefully |
| Allocation validation | `apply-rule` API rejects rules that don't sum to 100% |

---

## Environment Variables

```env
# Required for NVIDIA NIM LLM (get free key at build.nvidia.com)
NVIDIA_API_KEY=nvapi_...

# Toggle to disable stub mode when ready for production
ONRAMP_STUB_MODE=true   # set false + add ONRAMP_API_KEY for real
X402_STUB_MODE=true     # set false for real Horizon tx verification
```

---

## Production Checklist (Phase 5+)

- [ ] Replace executor mock delays with real x402 + Onramp API calls
- [ ] Add auto-approve threshold (e.g., bills < ₹1,000 skip approval)
- [ ] Add SMS/email notification when agent executes a decision
- [ ] Implement rate limiting middleware on `/api/ai/*` routes
- [ ] Add LLM response caching for repeated identical queries
- [ ] Real Soroban vault deposits (replace stub)
