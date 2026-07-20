import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

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
  const { ruleId, isActive } = body;

  if (!ruleId) {
    return NextResponse.json({ error: "ruleId is required" }, { status: 400 });
  }

  // Ensure user owns the rule (optional, but RLS usually handles it. Since we use service key, we must verify ownership)
  const { data: existingRule } = await supabase
    .from("allocation_rules")
    .select("id")
    .eq("id", ruleId)
    .eq("user_id", user.id)
    .single();

  if (!existingRule) {
    return NextResponse.json({ error: "Rule not found or unauthorized" }, { status: 403 });
  }

  const { error } = await serviceSupabase
    .from("allocation_rules")
    .update({ is_active: isActive })
    .eq("id", ruleId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
