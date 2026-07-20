import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { parseIntent } from "@/lib/ai/intent-parser";

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );

  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (!user || authErr) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const serviceSupabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_ROLE!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );

  const body = await request.json().catch(() => ({}));
  if (!body.message?.trim()) {
    return NextResponse.json({ error: "message is required" }, { status: 400 });
  }

  // 1. Insert User Message
  await serviceSupabase.from("ai_chat_messages").insert({
    user_id: user.id,
    role: "user",
    content: body.message,
    created_at: new Date().toISOString()
  });

  // 2. Parse Intent
  const intent = await parseIntent(body.message);

  // 2b. Lookup recipient if send_payment
  if (intent.intent === "send_payment" && intent.recipientName) {
    const { data: recipients } = await serviceSupabase
      .from("family_recipients")
      .select("*")
      .eq("user_id", user.id)
      .ilike("name", `%${intent.recipientName}%`)
      .limit(1);
    
    if (recipients && recipients.length > 0) {
      intent.recipientId = recipients[0].id;
      // You could also add a payeeIdentifier field to intent, but let's assume client fetches it or we pass it
    } else {
      intent.explanation += ` (Warning: Couldn't find a recipient matching "${intent.recipientName}")`;
    }
  }

  // 3. Insert Assistant Message
  await serviceSupabase.from("ai_chat_messages").insert({
    user_id: user.id,
    role: "assistant",
    content: intent.explanation,
    parsed_rule: intent.intent === "set_allocation" ? { allocations: intent.allocations } : 
                 intent.intent === "send_payment" ? { intent: "send_payment", amount: intent.amount, recipientId: intent.recipientId, recipientName: intent.recipientName } : null,
    llm_model: intent.source === "nvidia-nim" ? "NVIDIA Nemotron-4-340B" : "Keyword fallback",
    llm_latency_ms: intent.latencyMs,
    created_at: new Date().toISOString()
  });

  return NextResponse.json(intent);
}
