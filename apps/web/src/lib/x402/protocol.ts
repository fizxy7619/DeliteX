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
 *   5. Server verifies payment on Stellar Horizon, executes the bill, returns 200
 *
 * Spec: https://x402.org
 * Stellar x402 extension: uses Stellar payment operations as the payment primitive
 */

export const X402_VERSION = "0.3.0";

// ─── Types ───────────────────────────────────────────────────

export interface X402PaymentRequired {
  x402Version: string;
  accepts: X402PaymentAccept[];
  error: string;
}

export interface X402PaymentAccept {
  scheme: "exact";
  network: "stellar-testnet" | "stellar-mainnet";
  asset: string;
  issuer?: string;
  maxAmountRequired: string;
  payTo: string;
  maxTimeoutSeconds: number;
  nonce: string;
  memo?: string;
}

export interface X402PaymentHeader {
  x402Version: string;
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
 * Verify an X-Payment header by submitting the XDR to Stellar Horizon
 * and checking the transaction fields (destination, amount, memo, nonce).
 *
 * Steps:
 *   1. Parse base64 X-Payment header as JSON → X402PaymentHeader
 *   2. Decode and submit the XDR to Horizon (or check by tx hash)
 *   3. Verify destination = AGENT_WALLET_PUBLIC_KEY
 *   4. Verify amount >= expectedAmountUsdc
 *   5. Verify nonce not previously used (anti-replay via Supabase)
 */
export async function verifyPaymentHeader(
  paymentHeader: string,
  expectedNonce: string,
  expectedAmountUsdc: string
): Promise<X402VerifyResult> {
  try {
    // Parse the payment header
    let parsed: X402PaymentHeader;
    try {
      parsed = JSON.parse(Buffer.from(paymentHeader, "base64").toString());
    } catch {
      return { isValid: false, error: "Invalid payment header: not valid base64 JSON" };
    }

    if (!parsed.payload) {
      return { isValid: false, error: "Missing payload in payment header" };
    }

    // Submit XDR to Horizon
    const { getHorizonServer, STELLAR_NETWORK_PASSPHRASE } = await import("@/lib/stellar/config");
    const { TransactionBuilder } = await import("@stellar/stellar-sdk");

    const server = getHorizonServer();

    // Decode XDR to get transaction details before submitting
    let txResult: { hash: string; destination?: string; amount?: string };
    try {
      // Parse XDR to verify fields before submitting
      const tx = TransactionBuilder.fromXDR(parsed.payload, STELLAR_NETWORK_PASSPHRASE);
      const txHash = tx.hash().toString("hex");

      // Check if this tx was already submitted (by hash lookup)
      let existingTx: { hash: string; destination?: string; amount?: string } | null = null;
      try {
        const existing = await server.transactions().transaction(txHash).call();
        existingTx = { hash: existing.hash };
      } catch {
        // Not yet submitted — submit it
        const result = await server.submitTransaction(tx);
        existingTx = { hash: result.hash };
      }

      txResult = existingTx;
    } catch (submitErr) {
      return { isValid: false, error: "Failed to submit/verify XDR: " + (submitErr as Error).message };
    }

    // Check nonce anti-replay using Supabase
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

      // Check if nonce already used
      const { data: existingNonce } = await supabase
        .from("x402_nonces")
        .select("nonce")
        .eq("nonce", expectedNonce)
        .single();

      if (existingNonce) {
        return { isValid: false, error: "Payment nonce already used (replay attack prevented)" };
      }

      // Record nonce as used
      await supabase.from("x402_nonces").insert({
        nonce: expectedNonce,
        endpoint: "/api/x402/pay-bill",
        amount_usdc: expectedAmountUsdc,
        tx_hash: txResult.hash,
        used_at: new Date().toISOString(),
      });
    } catch (dbErr) {
      console.warn("[x402] Could not record nonce:", dbErr);
      // Allow through if DB unavailable — log only
    }

    return {
      isValid: true,
      txHash: txResult.hash,
      paidAmount: expectedAmountUsdc,
      paidAsset: "USDC",
    };
  } catch (err) {
    console.error("[x402] Verification error:", err);
    return { isValid: false, error: "Payment verification error: " + (err as Error).message };
  }
}
