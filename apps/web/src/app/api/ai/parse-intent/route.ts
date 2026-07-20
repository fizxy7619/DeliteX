import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { parseIntent } from "@/lib/ai/intent-parser";

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_ROLE!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  if (!body.message?.trim()) {
    return NextResponse.json({ error: "message is required" }, { status: 400 });
  }

  // 1. Insert User Message
  await supabase.from("ai_chat_messages").insert({
    user_id: user.id,
    role: "user",
    content: body.message,
    created_at: new Date().toISOString()
  });

  // 2. Parse Intent
  const intent = await parseIntent(body.message);

  // 3. Insert Assistant Message
  await supabase.from("ai_chat_messages").insert({
    user_id: user.id,
    role: "assistant",
    content: intent.explanation,
    parsed_rule: intent.intent === "set_allocation" ? { allocations: intent.allocations } : null,
    llm_model: intent.source === "nvidia-nim" ? "NVIDIA Nemotron-4-340B" : "Keyword fallback",
    llm_latency_ms: intent.latencyMs,
    created_at: new Date().toISOString()
  });

  return NextResponse.json(intent);
}
