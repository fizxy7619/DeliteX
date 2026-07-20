# DeliteX — Data Model to Blockchain Mapping

This document describes how the Phase 2 TypeScript domain models will map to Stellar accounts, trustlines, and Soroban smart contracts in Phase 3.

## Architecture Overview

```
[Client / Invoice]
        │
        │  USDC / EURC payment (Stellar)
        ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Stellar Settlement Layer                     │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │          User's Main Stellar Account (Income Bucket)     │   │
│  │  Asset: USDC (Centre / Circle) / EURC (Allbridge)        │   │
│  │  Trustline: established on first deposit                 │   │
│  └──────────────────────────────────────────────────────────┘   │
│              │                                                  │
│    AI Router Contract (Soroban)                                 │
│    Reads AllocationRule, executes atomic splits                 │
│              │                                                  │
│    ┌─────────┼──────────┬────────────────────┐                  │
│    ▼         ▼          ▼                    ▼                  │
│  Bills    Family    Savings (Vault)       Keep Cash             │
│  Sub-Acc  Sub-Acc   Soroban Contract    Sub-Acc / Buffer        │
└─────────────────────────────────────────────────────────────────┘
        │         │
        ▼         ▼
  Onramp.money / UPI / NEFT
  (Regulated INR Off-Ramp)
        │
        ▼
  Indian Bank Account / UPI VPA
```

---

## Domain Model → Stellar Mapping

### `UserProfile`

| Field | Stellar Mapping |
|---|---|
| `stellarPublicKey` | Main Stellar account public key (G...) |
| `inrPayoutMethod` | Off-ramp destination registered with Onramp.money |
| `kycStatus` | Must be `approved` before real payouts are enabled |

**Phase 3 action:** On signup, generate a Stellar keypair (or connect Freighter/Albedo). Establish USDC and EURC trustlines on the account.

---

### `PaymentEvent`

| Field | Stellar Mapping |
|---|---|
| `stellarTxHash` | `TransactionResult.hash` from Stellar Horizon API |
| `stellarLedger` | `ledger_attr` from the tx record |
| `sorobanContractId` | Contract ID if routed through a Soroban contract |
| `rail: "stellar"` | Native Stellar payment / path payment |
| `rail: "upi"` | Off-ramp payout via Onramp.money API |
| `fxRate` | Stellar DEX best path rate at time of swap |
| `fxSpreadPercent` | Measured spread vs. mid-market (target < 0.3%) |

**Phase 3 action:** Subscribe to `https://horizon.stellar.org/accounts/{pubkey}/payments` SSE stream. On each event, create a `PaymentEvent` row in Supabase.

---

### `AllocationRule` → Router Soroban Contract

The `RouterContract` receives USDC and atomically:
1. Reads the user's active `AllocationRule` (stored on-chain or fetched from Supabase).
2. Computes split amounts.
3. Sends each slice to the appropriate sub-account or Soroban vault.

```rust
// Soroban contract pseudocode (Phase 3)
pub fn route_payment(env: Env, user: Address, amount: i128, asset: Asset) {
    let rule = get_rule(&env, &user);   // AllocationRule from storage
    for slice in rule.allocations {
        let slice_amount = amount * slice.percent / 100;
        match slice.bucket {
            Bucket::Bills    => transfer(&env, &user.bills_account, slice_amount, &asset),
            Bucket::Family   => transfer(&env, &user.family_account, slice_amount, &asset),
            Bucket::Savings  => vault_deposit(&env, &user.vault_contract, slice_amount, &asset),
            Bucket::Income   => transfer(&env, &user.buffer_account, slice_amount, &asset),
        }
    }
}
```

| `AllocationRule` field | Contract mapping |
|---|---|
| `allocations[].percent` | Stored as `u32` (0–100) in contract storage |
| `incomeSourceFilter` | Used to gate the rule by sender address |
| `isActive` | Contract only applies active rules |
| `aiGenerated` | Metadata only — not on-chain |

---

### `Bill` → x402 / Autopay Agent

The AI agent uses the **x402 protocol** to authorize payment of bills:

1. Agent receives trigger (scheduled date, or event).
2. Agent calls Onramp.money API with: `{ payee_upi, amount_inr }`.
3. Onramp.money debits the user's INR balance and executes UPI transfer.
4. Agent creates a `PaymentEvent` (outgoing, rail=upi) in Supabase.

| `Bill` field | x402 / agent mapping |
|---|---|
| `payee` | UPI VPA / bank account number |
| `amount` | INR amount sent to Onramp |
| `isAutopayEnabled` | Agent will execute; if false, agent sends a notification only |
| `nextDueDate` | Agent scheduler trigger date |

---

### `FamilyRecipient` → Stellar + Onramp Path

Family transfers follow the same path as bills:
- USDC in Stellar → swap to INR via Onramp → UPI transfer to `payeeIdentifier`.
- `monthlyAllowance` creates a recurring `Bill`-like job in the agent scheduler.

---

### `SavingsVault` → Soroban Vault Contract

The vault contract is a **yield-bearing USDC vault** modeled after ERC-4626 (adapted for Soroban):

```rust
// Vault contract interface (Phase 3)
pub trait VaultTrait {
    fn deposit(env: Env, amount: i128, receiver: Address) -> i128;  // returns shares
    fn redeem(env: Env, shares: i128, receiver: Address) -> i128;   // returns USDC
    fn total_assets(env: Env) -> i128;
    fn convert_to_shares(env: Env, assets: i128) -> i128;
    fn estimated_apy(env: Env) -> u32;  // basis points
}
```

| `SavingsVault` field | Contract mapping |
|---|---|
| `sorobanContractId` | Vault contract address |
| `vaultSharesHeld` | ERC-4626-style shares in contract storage |
| `principalUsdc` | `convert_to_assets(shares_held)` at deposit time |
| `totalValueUsdc` | `convert_to_assets(shares_held)` current |
| `estimatedApyPercent` | `estimated_apy()` / 100 |
| `autoDepositThresholdInr` | Agent monitors buffer balance; triggers deposit when threshold exceeded |

---

### `AiMessage` → LLM Integration (Phase 3)

```
User message → POST /api/ai/parse-intent
    Body: { userId, message, context: { rules, bills, vault } }
    
/api/ai/parse-intent:
    1. Call GPT-4o / Gemini with structured output schema
    2. Schema validates: { intent, bucket?, percent?, billId?, action }
    3. Return: { parsedRule | null, confirmationText }
    
User confirms → POST /api/ai/apply-rule
    → Updates allocation_rules table in Supabase
    → (Phase 4) Submits tx to Router Soroban contract
```

---

## Environment Variables Required (Phase 3 additions)

```env
# Stellar
STELLAR_NETWORK=MAINNET
STELLAR_RPC_URL=https://horizon.stellar.org
STELLAR_AGENT_SECRET_KEY=         # Agent's signing key for automated txs

# Soroban Contract IDs
SOROBAN_CONTRACT_ID_ROUTER=       # Router contract (splits payments)
SOROBAN_CONTRACT_ID_VAULT=        # Yield vault contract

# Onramp.money
ONRAMP_API_KEY=
ONRAMP_API_SECRET=
ONRAMP_WEBHOOK_SECRET=            # For verifying payout callbacks

# AI
OPENAI_API_KEY=                   # GPT-4o for NLP parsing
```
