import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    const body = await request.json();
    const { userId, amount, currency, counterparty, description, txHash, bucket, direction } = body;

    if (!userId || !amount || !txHash) {
      return NextResponse.json({ error: "userId, amount, and txHash are required" }, { status: 400 });
    }

    const { error } = await supabaseAdmin.from("payment_events").insert({
      user_id: userId,
      direction: direction || "incoming",
      bucket: bucket || "income",
      status: "completed",
      amount: parseFloat(amount),
      currency: currency || "XLM",
      counterparty: counterparty,
      description: description,
      stellar_tx_hash: txHash,   // Correct column name (not tx_hash)
      rail: "stellar",
      settled_at: new Date().toISOString(),
    });

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Failed to record payment:", err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
