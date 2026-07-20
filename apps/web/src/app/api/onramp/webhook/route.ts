import { NextRequest, NextResponse } from "next/server";
import { onrampConnector, type OnrampWebhookPayload } from "@/lib/onramp/connector";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("X-Onramp-Signature");

    if (!signature || !onrampConnector.verifyWebhookSignature(rawBody, signature)) {
      return new NextResponse("Invalid signature", { status: 401 });
    }

    const payload = JSON.parse(rawBody) as OnrampWebhookPayload;

    // Use service role for webhooks
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!, // Must use service role to bypass RLS for webhooks
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: () => {},
        },
      }
    );

    // Fetch the original onramp_transaction to correlate
    const { data: tx, error: fetchErr } = await supabase
      .from("onramp_transactions")
      .select("id, user_id, status")
      .eq("onramp_tx_id", payload.transactionId)
      .single();

    if (fetchErr || !tx) {
      console.warn("Webhook transaction not found:", payload.transactionId);
      return new NextResponse("Transaction not found", { status: 404 });
    }

    // Update status based on event
    let newStatus = tx.status;
    if (payload.event === "payout.completed") newStatus = "completed";
    else if (payload.event === "payout.failed") newStatus = "failed";
    else if (payload.event === "payout.processing") newStatus = "processing";

    const { error: updateErr } = await supabase
      .from("onramp_transactions")
      .update({
        status: newStatus,
        utr_number: payload.utrNumber,
        failure_reason: payload.failureReason,
        updated_at: new Date().toISOString(),
      })
      .eq("id", tx.id);

    if (updateErr) {
      console.error("Failed to update transaction status:", updateErr);
      return new NextResponse("Internal Server Error", { status: 500 });
    }

    return new NextResponse("OK", { status: 200 });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return new NextResponse("Bad Request", { status: 400 });
  }
}
