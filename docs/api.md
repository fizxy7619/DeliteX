# API Reference

DeliteX exposes several internal API routes used by the Next.js frontend to interact with Supabase, Stellar, and the NVIDIA NIM AI agent.

All API routes live under `apps/web/src/app/api/`.

## Authentication

All state-modifying API routes are protected. They use the Supabase server client to extract the current user session from cookies. If a request is made without a valid session, it will return `401 Unauthorized`.

---

## AI Agent (`/api/ai/*`)

### `POST /api/ai/parse-intent`
- **Description**: Uses NVIDIA Nemotron to parse a natural language string into a structured `ParsedIntent` object.
- **Request Body**: `{ message: string }`
- **Response**: `{ intent: ParsedIntent, model: string, latencyMs: number }`

### `POST /api/ai/propose`
- **Description**: Generates an allocation proposal for an incoming payment using the user's rules and pending bills.
- **Request Body**: `{ paymentEventId: string }`
- **Response**: `{ proposal: AgentDecision }` (Status is `pending`)

### `POST /api/ai/approve`
- **Description**: Confirms an AI proposal and executes the underlying line items (x402 bill payments, Soroban deposits, Onramp conversions).
- **Request Body**: `{ decisionId: string }`
- **Response**: `{ success: true, executedCount: number }`

---

## Yield Vault (`/api/vault/*`)

### `GET /api/vault/positions`
- **Description**: Returns all active and past vault positions for the user, enriched with current yield calculations.
- **Response**: `{ positions: VaultPosition[] }`

### `POST /api/vault/deposit`
- **Description**: Deposits USDC into a Soroban yield vault strategy.
- **Request Body**: `{ amountUsdc: number, strategy: "conservative" | "stable" }`
- **Response**: `{ receipt: DepositReceipt }`

### `POST /api/vault/withdraw`
- **Description**: Withdraws a vault position and returns principal + yield.
- **Request Body**: `{ positionId: string }`
- **Response**: `{ receipt: WithdrawReceipt }`

---

## Stellar & Wallets (`/api/stellar/*`)

### `GET /api/stellar/account`
- **Description**: Fetches balance and status of the user's testnet Stellar account.
- **Response**: `{ accountId: string, balances: Array<{ asset_type: string, balance: string }> }`

### `GET /api/stellar/payments`
- **Description**: Fetches recent incoming and outgoing payments from the Stellar ledger.
- **Response**: `{ payments: PaymentEvent[] }`

---

## Fiat On/Off-Ramp (`/api/onramp/*`)

### `POST /api/onramp/convert`
- **Description**: Initiates a USDC to INR conversion via Onramp.money.
- **Request Body**: `{ amountUsdc: number, recipientVpa: string }`
- **Response**: `{ orderId: string, status: string }`

---

## Micropayments (`/api/x402/*`)

### `POST /api/x402/pay-bill`
- **Description**: Pays a bill using the x402 agentic payment protocol over Stellar.
- **Request Body**: `{ billId: string, amountInr: number }`
- **Response**: `{ receipt: x402Receipt }`
