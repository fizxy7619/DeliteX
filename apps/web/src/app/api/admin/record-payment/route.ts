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

    // Trigger AI Agent to generate a proposal for this incoming payment
    if (direction === "incoming" || bucket === "income") {
      try {
        const { generateProposal, saveDecision } = await import("@/lib/ai/agent-engine");
        // amount is usually in XLM here, we treat it as USDC for the simulation or convert it.
        // Let's assume the amount is USDC-equivalent for the proposal (e.g. 500)
        // Wait, admin sends XLM. 1 XLM = $0.12 USDC. So amountUsdc = XLM * 0.12
        const isXlm = (currency || "XLM").toUpperCase() === "XLM";
        const parsedAmount = parseFloat(amount);
        const amountUsdc = isXlm ? parsedAmount * 0.12 : parsedAmount;
        
        const proposal = await generateProposal(userId, amountUsdc, 84.5);
        await saveDecision(userId, proposal);

        // Notify via AI message
        await supabaseAdmin.from("ai_chat_messages").insert([
          {
            user_id: userId,
            role: "assistant",
            content: `✦ I detected a new incoming payment of ${amount} ${currency || "XLM"}. I've prepared a new allocation proposal for you. Check the **Agent** tab to review and approve!`,
            llm_model: "Agent Engine",
            created_at: new Date().toISOString()
          }
        ]);
      } catch (aiErr) {
        console.error("Failed to trigger AI agent:", aiErr);
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Failed to record payment:", err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
