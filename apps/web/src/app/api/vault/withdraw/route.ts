import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { withdrawFromVault, calculateCurrentYield } from "@/lib/vault/soroban-vault";

export async function POST(req: Request) {
  try {
    const { positionId } = await req.json() as { positionId: string };
    if (!positionId) return NextResponse.json({ error: "Missing positionId" }, { status: 400 });

    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_ROLE!,
      { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: position, error: fetchErr } = await supabase
      .from("vault_positions")
      .select("*")
      .eq("id", positionId)
      .eq("user_id", user.id)
      .eq("status", "active")
      .single();

    if (fetchErr || !position) {
      return NextResponse.json({ error: "Position not found" }, { status: 404 });
    }

    const { daysActive } = calculateCurrentYield(
      position.amount_usdc,
      position.apy_percent,
      position.created_at
    );

    const receipt = await withdrawFromVault(
      positionId,
      position.amount_usdc,
      position.apy_percent,
      daysActive
    );

    await supabase.from("vault_positions").update({
      status: "withdrawn",
      withdrawn_at: receipt.withdrawnAt,
    }).eq("id", positionId);

    // Update savings_vaults
    const { data: vault } = await supabase.from("savings_vaults").select("*").eq("user_id", user.id).single();
    if (vault) {
      await supabase.from("savings_vaults").update({
        total_value_usdc: Math.max(0, Number(vault.total_value_usdc) - position.amount_usdc),
        yield_earned_usdc: Number(vault.yield_earned_usdc) + receipt.yieldEarned
      }).eq("id", vault.id);
    }

    return NextResponse.json({ receipt });
  } catch (err) {
    console.error("[vault/withdraw] error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
