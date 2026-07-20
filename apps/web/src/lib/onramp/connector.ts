/**
 * Onramp.money Connector
 *
 * This module provides a typed interface for the Onramp.money API,
 * which converts USDC (Stellar) → INR and executes UPI/NEFT payouts.
 *
 * STUB STATUS: All methods return mock responses.
 * Phase 3 Production: Replace STUB_MODE with real API calls.
 *
 * Onramp.money docs: https://docs.onramp.money
 * Compliance: Onramp.money holds a PPI license and handles KYC/AML.
 *
 * ---
 * Flow:
 *   1. User initiates payout (bill payment / family transfer)
 *   2. DeliteX → POST /api/onramp/convert (server-side)
 *   3. Server calls Onramp.money: swap USDC → INR + UPI transfer
 *   4. Onramp.money sends webhook to /api/onramp/webhook
 *   5. Server updates PaymentEvent status in Supabase
 */

const STUB_MODE = true; // Set to false when ready for real API

const ONRAMP_BASE_URL = "https://api.onramp.money/v1";
const ONRAMP_API_KEY = process.env.ONRAMP_API_KEY ?? "";
const ONRAMP_API_SECRET = process.env.ONRAMP_API_SECRET ?? "";

// ─── Request / Response Types ────────────────────────────────

export interface OnrampConvertRequest {
  /** USDC amount to convert */
  usdcAmount: number;
  /** Recipient UPI VPA or bank account */
  recipientIdentifier: string;
  recipientType: "upi" | "bank_account";
  /** Human-readable reason for payout */
  description: string;
  /** Your internal reference ID */
  referenceId: string;
}

export interface OnrampConvertResponse {
  /** Onramp.money transaction ID */
  transactionId: string;
  status: "pending" | "processing" | "completed" | "failed";
  /** INR amount credited to recipient */
  inrAmount: number;
  /** FX rate used */
  exchangeRate: number;
  /** Onramp.money fee in INR */
  feeInr: number;
  /** Estimated completion time in minutes */
  estimatedMinutes: number;
  /** Timestamp */
  createdAt: string;
}

export interface OnrampFxQuote {
  usdcAmount: number;
  inrAmount: number;
  exchangeRate: number;
  spread: number; // %
  feeInr: number;
  validUntilMs: number;
  quoteId: string;
}

export interface OnrampWebhookPayload {
  event: "payout.completed" | "payout.failed" | "payout.processing";
  transactionId: string;
  referenceId: string;
  inrAmount: number;
  utrNumber?: string; // UPI Transaction Reference
  failureReason?: string;
  timestamp: string;
}

// ─── Connector Implementation ────────────────────────────────

export class OnrampConnector {
  /** Get a live FX quote for USDC → INR */
  async getFxQuote(usdcAmount: number): Promise<OnrampFxQuote> {
    if (STUB_MODE) {
      // Stub: simulate 84.1 INR/USD with 0.25% spread
      const rate = 84.1;
      const spread = 0.25;
      const inrGross = usdcAmount * rate;
      const feeInr = inrGross * (spread / 100);
      return {
        usdcAmount,
        inrAmount: Math.round((inrGross - feeInr) * 100) / 100,
        exchangeRate: rate,
        spread,
        feeInr: Math.round(feeInr * 100) / 100,
        validUntilMs: Date.now() + 30_000, // 30-second quote
        quoteId: `quote_stub_${Date.now().toString(36)}`,
      };
    }

    const res = await fetch(`${ONRAMP_BASE_URL}/fx/quote`, {
      method: "POST",
      headers: this._headers(),
      body: JSON.stringify({ amount: usdcAmount, from: "USDC", to: "INR" }),
    });
    if (!res.ok) throw new Error(`Onramp FX quote failed: ${res.status}`);
    return res.json();
  }

  /** Initiate a USDC → INR conversion + UPI payout */
  async initiateConvert(
    req: OnrampConvertRequest
  ): Promise<OnrampConvertResponse> {
    if (STUB_MODE) {
      const quote = await this.getFxQuote(req.usdcAmount);
      return {
        transactionId: `onramp_stub_${Date.now().toString(36)}`,
        status: "pending",
        inrAmount: quote.inrAmount,
        exchangeRate: quote.exchangeRate,
        feeInr: quote.feeInr,
        estimatedMinutes: 2,
        createdAt: new Date().toISOString(),
      };
    }

    const res = await fetch(`${ONRAMP_BASE_URL}/payouts`, {
      method: "POST",
      headers: this._headers(),
      body: JSON.stringify({
        amount_usdc: req.usdcAmount,
        recipient: req.recipientIdentifier,
        recipient_type: req.recipientType,
        description: req.description,
        reference_id: req.referenceId,
      }),
    });
    if (!res.ok) throw new Error(`Onramp payout failed: ${res.status}`);
    return res.json();
  }

  /** Fetch status of a payout by Onramp transaction ID */
  async getPayoutStatus(transactionId: string): Promise<OnrampConvertResponse> {
    if (STUB_MODE) {
      return {
        transactionId,
        status: "completed",
        inrAmount: 8400,
        exchangeRate: 84.0,
        feeInr: 21,
        estimatedMinutes: 0,
        createdAt: new Date().toISOString(),
      };
    }

    const res = await fetch(`${ONRAMP_BASE_URL}/payouts/${transactionId}`, {
      headers: this._headers(),
    });
    if (!res.ok) throw new Error(`Onramp status check failed: ${res.status}`);
    return res.json();
  }

  /**
   * Verify a webhook signature from Onramp.money.
   * Phase 3: Use HMAC-SHA256 with ONRAMP_WEBHOOK_SECRET.
   */
  verifyWebhookSignature(
    payload: string,
    signature: string
  ): boolean {
    if (STUB_MODE) return true;
    // TODO Phase 3: crypto.createHmac("sha256", process.env.ONRAMP_WEBHOOK_SECRET).update(payload).digest("hex") === signature
    return signature === "stub";
  }

  private _headers(): HeadersInit {
    return {
      "Content-Type": "application/json",
      "X-Api-Key": ONRAMP_API_KEY,
      "X-Api-Secret": ONRAMP_API_SECRET,
    };
  }
}

// Singleton
export const onrampConnector = new OnrampConnector();
