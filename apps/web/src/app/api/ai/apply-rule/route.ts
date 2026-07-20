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

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const { allocations, name, aiPrompt } = body;

  if (!Array.isArray(allocations) || allocations.length === 0) {
    return NextResponse.json({ error: "allocations array is required" }, { status: 400 });
  }

  const total = allocations.reduce((s: number, a: { percent: number }) => s + (a.percent ?? 0), 0);
  if (total !== 100) {
    return NextResponse.json({ error: `Allocations must sum to 100%, got ${total}%` }, { status: 422 });
  }

  // Deactivate existing active rules
  await supabase
    .from("allocation_rules")
    .update({ is_active: false })
    .eq("user_id", user.id)
    .eq("is_active", true);

  // Insert new rule
  const { data, error } = await supabase
    .from("allocation_rules")
    .insert({
      user_id: user.id,
      name: name ?? "AI Generated Rule",
      allocations,
      is_active: true,
      ai_generated: !!aiPrompt,
      ai_prompt: aiPrompt ?? null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true, rule: data });
}
