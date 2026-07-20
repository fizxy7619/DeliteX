import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { generateProposal, saveDecision } from "@/lib/ai/agent-engine";

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const amountUsdc = parseFloat(body.amountUsdc ?? "500"); // default $500 USDC simulation
  const fxRate = body.fxRate ?? 84.5;

  if (isNaN(amountUsdc) || amountUsdc <= 0) {
    return NextResponse.json({ error: "Invalid amountUsdc" }, { status: 400 });
  }

  const proposal = await generateProposal(user.id, amountUsdc, fxRate);
  const decisionId = await saveDecision(user.id, proposal);

  // Insert System message
  const serviceSupabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_ROLE!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );
  
  await serviceSupabase.from("ai_chat_messages").insert([
    {
      user_id: user.id,
      role: "user",
      content: `Simulate incoming payment of $${amountUsdc}`,
      created_at: new Date().toISOString()
    },
    {
      user_id: user.id,
      role: "assistant",
      content: `✦ Proposal ready! I've analyzed your rules and prepared an allocation plan for $${amountUsdc} USDC (≈₹${(amountUsdc * fxRate).toLocaleString("en-IN")}). Review and approve the proposal above.`,
      llm_model: "Agent Engine",
      created_at: new Date(Date.now() + 1000).toISOString()
    }
  ]);

  return NextResponse.json({ decisionId, proposal });
}
