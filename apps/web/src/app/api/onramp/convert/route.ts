/**
 * POST /api/onramp/convert
 * Initiates a USDC → INR conversion + UPI payout via Onramp.money.
 * Currently in STUB_MODE — returns mock responses.
 *
 * Body: { usdcAmount, recipientIdentifier, recipientType, description, referenceId }
 */
import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { onrampConnector } from "@/lib/onramp/connector";

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (!body?.usdcAmount || !body?.recipientIdentifier) {
    return NextResponse.json({ error: "usdcAmount and recipientIdentifier are required" }, { status: 400 });
  }

  const result = await onrampConnector.initiateConvert({
    usdcAmount: body.usdcAmount,
    recipientIdentifier: body.recipientIdentifier,
    recipientType: body.recipientType ?? "upi",
    description: body.description ?? "DeliteX payout",
    referenceId: body.referenceId ?? `delitex_${Date.now()}`,
  });

  // In production: save the transactionId to payment_events table for webhook correlation
  return NextResponse.json(result);
}

/**
 * GET /api/onramp/quote?usdcAmount=100
 * Returns a live FX quote for USDC → INR.
 */
export async function GET(request: NextRequest) {
  const usdcAmount = parseFloat(
    request.nextUrl.searchParams.get("usdcAmount") ?? "0"
  );
  if (!usdcAmount || usdcAmount <= 0) {
    return NextResponse.json({ error: "usdcAmount must be positive" }, { status: 400 });
  }

  const quote = await onrampConnector.getFxQuote(usdcAmount);
  return NextResponse.json(quote);
}
