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

  return NextResponse.json({ decisionId, proposal });
}
