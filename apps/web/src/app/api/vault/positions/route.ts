import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { calculateCurrentYield } from "@/lib/vault/soroban-vault";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_ROLE!,
      { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: positions, error } = await supabase
      .from("vault_positions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const enriched = (positions ?? []).map((p) => {
      if (p.status !== "active") return { ...p, yieldEarned: 0, currentValue: p.amount_usdc, daysActive: 0 };
      const { yieldEarned, daysActive, currentValue } = calculateCurrentYield(
        p.amount_usdc, p.apy_percent, p.created_at
      );
      return { ...p, yieldEarned, daysActive, currentValue };
    });

    return NextResponse.json({ positions: enriched });
  } catch (err) {
    console.error("[vault/positions] error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
