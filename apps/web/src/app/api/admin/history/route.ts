import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader) return NextResponse.json({ error: "Missing Auth" }, { status: 401 });

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data: { user }, error: authErr } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    if (authErr || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const serviceSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get the user's admin wallet public key
    const { data: wallet } = await serviceSupabase
      .from("admin_wallets")
      .select("public_key")
      .eq("user_id", user.id)
      .single();

    if (!wallet) return NextResponse.json({ history: [] });

    // Fetch all payment events where the admin wallet was the counterparty
    const { data: events, error } = await serviceSupabase
      .from("payment_events")
      .select(`
        id, amount, currency, tx_hash, created_at, user_id,
        user_profiles ( full_name, email )
      `)
      .eq("counterparty", wallet.public_key)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ history: events });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
