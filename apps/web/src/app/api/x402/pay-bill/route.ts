/**
 * POST /api/x402/pay-bill
 *
 * An x402-protected endpoint. The AI agent calls this to pay a bill.
 *
 * Without X-Payment header → returns 402 Payment Required
 * With valid X-Payment header → executes the bill payment (stub) → returns 200
 *
 * x402 Protocol Flow:
 *   1. Agent: POST /api/x402/pay-bill { billId }
 *   2. Server: 402 { accepts: [{ scheme:"exact", asset:"USDC", amount:"0.05", ... }] }
 *   3. Agent: constructs Stellar tx, signs, XDR-encodes
 *   4. Agent: POST /api/x402/pay-bill { billId } + X-Payment: <base64 encoded header>
 *   5. Server: verifyPaymentHeader → execute bill → 200 { success: true }
 */
import { NextResponse, type NextRequest } from "next/server";
import { randomUUID } from "crypto";
import {
  buildPaymentRequired,
  verifyPaymentHeader,
} from "@/lib/x402/protocol";
import { IS_TESTNET_MODE } from "@/lib/stellar/config";

// Cost to call this endpoint: 0.05 USDC
const ENDPOINT_COST_USDC = "0.05";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const billId = body.billId as string | undefined;

  if (!billId) {
    return NextResponse.json({ error: "billId is required" }, { status: 400 });
  }

  // Check for x402 payment header
  const paymentHeader = request.headers.get("X-Payment");

  if (!paymentHeader) {
    // No payment → respond 402 with payment requirements
    const nonce = randomUUID();
    const paymentRequired = await buildPaymentRequired({
      usdcAmount: ENDPOINT_COST_USDC,
      memo: `bill:${billId}`,
      nonce,
      isTestnet: IS_TESTNET_MODE,
    });

    return NextResponse.json(paymentRequired, {
      status: 402,
      headers: {
        "X-Payment-Required": "true",
        "X-402-Version": "0.3.0",
      },
    });
  }

  // Verify the payment
  const nonce = body.nonce as string ?? "";
  const result = await verifyPaymentHeader(paymentHeader, nonce, ENDPOINT_COST_USDC);

  if (!result.isValid) {
    return NextResponse.json(
      { error: "Payment verification failed", detail: result.error },
      { status: 402 }
    );
  }

  // Execute the bill payment (stub)
  // Phase 3: call onrampConnector.initiateConvert() with real bill data
  const executionResult = {
    success: true,
    billId,
    txHash: result.txHash,
    paidUsdc: result.paidAmount,
    executedAt: new Date().toISOString(),
    stub: true,
    message: "Bill payment executed (stub). Phase 3: real UPI payout via Onramp.money.",
  };

  return NextResponse.json(executionResult, {
    status: 200,
    headers: {
      "X-Payment-Response": Buffer.from(JSON.stringify({ txHash: result.txHash })).toString("base64"),
    },
  });
}
