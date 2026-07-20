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
  const { allocations, name, aiPrompt } = body;

  if (!Array.isArray(allocations) || allocations.length === 0) {
    return NextResponse.json({ error: "allocations array is required" }, { status: 400 });
  }

  const validBuckets = ["income", "savings", "family", "bills"];
  allocations.forEach((a: { bucket: string; percent: number }) => {
    if (!validBuckets.includes(a.bucket)) {
      a.bucket = "income";
    }
  });

  // Combine duplicates (e.g. if we mapped 'remittance' to 'income' and 'income' already exists)
  const combined: Record<string, number> = {};
  allocations.forEach((a: { bucket: string; percent: number | string }) => {
    combined[a.bucket] = (combined[a.bucket] || 0) + Number(a.percent ?? 0);
  });
  const normalizedAllocations = Object.entries(combined).map(([bucket, percent]) => ({ bucket, percent }));

  let total = normalizedAllocations.reduce((s: number, a: { percent: number }) => s + (a.percent ?? 0), 0);
  
  // Auto-fill remainder to 'income' bucket
  if (total < 100) {
    const existingIncome = normalizedAllocations.find((a: { bucket: string; percent: number }) => a.bucket === "income");
    if (existingIncome) {
      existingIncome.percent += (100 - total);
    } else {
      normalizedAllocations.push({ bucket: "income", percent: 100 - total });
    }
    total = 100;
  }

  if (total !== 100) {
    return NextResponse.json({ error: `Allocations must sum to 100%, got ${total}%` }, { status: 422 });
  }

  // Deactivate existing active rules
  await serviceSupabase
    .from("allocation_rules")
    .update({ is_active: false })
    .eq("user_id", user.id)
    .eq("is_active", true);

  // Insert new rule
  const { data, error } = await serviceSupabase
    .from("allocation_rules")
    .insert({
      user_id: user.id,
      name: name ?? "AI Generated Rule",
      allocations: normalizedAllocations,
      is_active: true,
      ai_generated: !!aiPrompt,
      ai_prompt: aiPrompt ?? null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true, rule: data });
}
