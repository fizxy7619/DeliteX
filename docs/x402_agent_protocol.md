# x402 AI Agent Execution Protocol

This document details how the DeliteX AI Agent interacts with x402-enabled endpoints to autonomously pay bills and route funds.

## 1. What is x402?
x402 is an HTTP extension based on the `402 Payment Required` status code. It allows machines (like our AI agent) to hit a paid API, receive a machine-readable invoice, settle the invoice on the Stellar network, and retry the request with cryptographic proof of payment.

## 2. AI Agent Workflow

When the AI Agent determines that it needs to pay a bill (e.g., executing the rule: "Pay ₹1,500 to Electricity Provider every 5th of the month"), it follows this protocol:

### Step 1: Initial Request (Discovery)
The Agent sends a standard HTTP POST to the biller's endpoint without any payment headers.
```http
POST /api/x402/pay-bill HTTP/1.1
Content-Type: application/json

{ "billId": "electricity_001" }
```

### Step 2: Handle 402 Response
The endpoint rejects the request and returns a `402 Payment Required` along with an invoice detailing the exact Stellar account, amount, and asset required.
```http
HTTP/1.1 402 Payment Required
Content-Type: application/json

{
  "error": "Payment required",
  "accepts": [
    {
      "network": "stellar",
      "destination": "GA...XYZ",
      "amount": "15.00",
      "asset": "USDC",
      "nonce": "abc123nonce",
      "memo": "bill_electricity_001"
    }
  ]
}
```

### Step 3: Transaction Execution
1. The AI Agent parses the `accepts` array.
2. It verifies that the `amount` aligns with the user's defined allocation rules and budget.
3. It constructs a Stellar transaction sending `15.00 USDC` to `GA...XYZ` with the specified `memo`.
4. It submits the transaction to the Horizon network.
5. It extracts the raw transaction envelope (XDR) or the transaction hash.

### Step 4: Retry with Payment Proof
The Agent retries the original request, attaching the `X-Payment` header containing the proof.
```http
POST /api/x402/pay-bill HTTP/1.1
Content-Type: application/json
X-Payment: base64(JSON({ "scheme": "exact", "payload": "<Stellar_Tx_XDR>" }))

{ "billId": "electricity_001", "nonce": "abc123nonce" }
```

### Step 5: Verification & Fulfillment
The server verifies the `X-Payment` header (checking the Horizon network for confirmation and the `x402_nonces` table to prevent replay attacks). If valid, it processes the bill payment and returns `200 OK`.

## 3. Implementation in DeliteX
Currently, the `/api/x402/pay-bill` endpoint is implemented as a **stub** for the frontend demo.
When transitioning to production, the `verifyPaymentHeader` function in `src/lib/x402/protocol.ts` must be updated to parse the XDR payload and query Horizon to ensure the transaction was successfully ledgered before fulfilling the request.
