import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { depositToVault, type VaultStrategy } from "@/lib/vault/soroban-vault";

export async function POST(req: Request) {
  try {
    const { amountUsdc, strategy = "conservative" } = await req.json() as {
      amountUsdc: number;
      strategy?: VaultStrategy;
    };

    if (!amountUsdc || amountUsdc <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }
    if (!["conservative", "stable"].includes(strategy)) {
      return NextResponse.json({ error: "Invalid strategy" }, { status: 400 });
    }

    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_ROLE!,
      { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Execute deposit via Soroban stub
    const receipt = await depositToVault(amountUsdc, strategy);

    // Persist to DB
    const { error: dbError } = await supabase.from("vault_positions").insert({
      id: receipt.positionId,
      user_id: user.id,
      amount_usdc: receipt.amountUsdc,
      strategy: receipt.strategy,
      apy_percent: receipt.apyPercent,
      status: "active",
      tx_hash: receipt.txHash,
    });

    if (dbError) {
      console.error("[vault/deposit] DB error:", dbError);
      return NextResponse.json({ error: "Failed to save position" }, { status: 500 });
    }

    return NextResponse.json({ receipt });
  } catch (err) {
    console.error("[vault/deposit] error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
