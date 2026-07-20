/**
 * x402 Integration — Agentic Payment Protocol
 *
 * x402 is an HTTP payment protocol where servers charge micropayments
 * for API calls. The AI agent uses this to pay bills programmatically.
 *
 * Protocol flow:
 *   1. Agent calls POST /api/x402/pay-bill
 *   2. Server responds 402 with a PaymentRequired header describing cost
 *   3. Agent constructs a Stellar payment + signs with agent wallet
 *   4. Agent retries with X-Payment header containing the signed payment
 *   5. Server verifies payment, executes the bill, returns 200
 *
 * Spec: https://x402.org
 * Stellar x402 extension: uses Stellar payment operations as the payment primitive
 *
 * STUB_MODE: Currently returns mock success without real verification.
 */

export const X402_VERSION = "0.3.0";

// ─── Types ───────────────────────────────────────────────────

export interface X402PaymentRequired {
  /** x402 version */
  x402Version: string;
  /** Payment accepts */
  accepts: X402PaymentAccept[];
  /** Error message for 402 */
  error: string;
}

export interface X402PaymentAccept {
  /** Payment protocol scheme */
  scheme: "exact";
  /** Network identifier */
  network: "stellar-testnet" | "stellar-mainnet";
  /** Stellar asset (USDC, XLM) */
  asset: string;
  /** Issuer of asset */
  issuer?: string;
  /** Max amount accepted (in asset units) */
  maxAmountRequired: string;
  /** Recipient's Stellar public key */
  payTo: string;
  /** Max age of payment in seconds */
  maxTimeoutSeconds: number;
  /** A unique nonce to prevent replay */
  nonce: string;
  /** Memo required on Stellar payment */
  memo?: string;
}

export interface X402PaymentHeader {
  /** x402 version */
  x402Version: string;
  /** Which accept scheme this matches */
  scheme: "exact";
  network: string;
  /** Signed Stellar transaction XDR (base64) */
  payload: string;
}

export interface X402VerifyResult {
  isValid: boolean;
  txHash?: string;
  error?: string;
  paidAmount?: string;
  paidAsset?: string;
}

// ─── Server-side helpers ──────────────────────────────────────

const AGENT_WALLET_PUBLIC_KEY =
  process.env.AGENT_WALLET_PUBLIC_KEY ?? "GCEZWKCA5VLDNRLN3RPRJMRZOX3Z6G5CHCGBM4KGTMQ3YPVZEGQISGCB";

/**
 * Build the 402 response body telling the agent what to pay.
 */
export function buildPaymentRequired(params: {
  usdcAmount: string;
  memo: string;
  nonce: string;
  isTestnet: boolean;
}): X402PaymentRequired {
  const TESTNET_USDC_ISSUER = "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5";

  return {
    x402Version: X402_VERSION,
    error: "Payment required to execute this action.",
    accepts: [
      {
        scheme: "exact",
        network: params.isTestnet ? "stellar-testnet" : "stellar-mainnet",
        asset: "USDC",
        issuer: TESTNET_USDC_ISSUER,
        maxAmountRequired: params.usdcAmount,
        payTo: AGENT_WALLET_PUBLIC_KEY,
        maxTimeoutSeconds: 300,
        nonce: params.nonce,
        memo: params.memo,
      },
    ],
  };
}

/**
 * Verify an X-Payment header from the agent.
 * STUB: Returns true without real verification.
 *
 * Phase 3: Submit the XDR transaction to Horizon and verify:
 *   - Destination = AGENT_WALLET_PUBLIC_KEY
 *   - Amount >= required
 *   - Memo matches
 *   - Nonce not replayed (check Supabase x402_nonces table)
 */
export async function verifyPaymentHeader(
  paymentHeader: string,
  expectedNonce: string,
  expectedAmountUsdc: string
): Promise<X402VerifyResult> {
  // STUB: always return valid if stub mode is not explicitly false
  if (process.env.X402_STUB_MODE !== "false") {
    // Record nonce in db to simulate anti-replay, but don't fail if db not hooked up
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const cookieStore = await require("next/headers").cookies();
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { createServerClient } = require("@supabase/ssr");
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
          cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} },
        }
      );
      await supabase.from("x402_nonces").insert({
        nonce: expectedNonce,
        endpoint: "/api/x402/pay-bill",
        amount_usdc: expectedAmountUsdc,
        used_at: new Date().toISOString(),
      });
    } catch (e) {
      console.warn("Could not record nonce in DB during stub mode:", e);
    }

    return {
      isValid: true,
      txHash: `stub_x402_${Date.now().toString(36)}`,
      paidAmount: expectedAmountUsdc,
      paidAsset: "USDC",
    };
  }

  // Production: parse XDR, submit to Horizon, verify fields
  try {
    const parsed: X402PaymentHeader = JSON.parse(
      Buffer.from(paymentHeader, "base64").toString()
    );
    // TODO: submit parsed.payload XDR to Horizon + verify
    void parsed;
    void expectedNonce;
    return { isValid: false, error: "Production x402 verification not yet implemented" };
  } catch {
    return { isValid: false, error: "Invalid payment header format" };
  }
}
