import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Keypair } from "@stellar/stellar-sdk";
import { generateKeypair, fundTestnetAccount } from "@/lib/stellar/accounts";

// We need a service role client to bypass RLS or we can use the authenticated user client if we pass the token.
// Actually, since we want to enforce RLS, we should create a client using the user's auth token.
// But wait, in Next.js App Router API, we can just use the service role and check the user ID manually,
// or we can use the Supabase Auth helper. Since we already have a pattern in other routes:
// let's just use the service role and explicitly verify the session.

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

    const { data, error } = await serviceSupabase
      .from("admin_wallets")
      .select("public_key, secret_key")
      .eq("user_id", user.id)
      .single();

    if (error || !data) {
      return NextResponse.json({ exists: false });
    }

    return NextResponse.json({ exists: true, publicKey: data.public_key, secretKey: data.secret_key });
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader) return NextResponse.json({ error: "Missing Auth" }, { status: 401 });

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data: { user }, error: authErr } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    if (authErr || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { action, secretKey } = body;

    let kp: { publicKey: string; secretKey: string } | undefined;
    
    if (action === "generate") {
      kp = generateKeypair();
      // Fund it
      const success = await fundTestnetAccount(kp.publicKey);
      if (!success) throw new Error("Friendbot funding failed");
    } else if (action === "restore" && secretKey) {
      const parsedKp = Keypair.fromSecret(secretKey);
      kp = { secretKey: parsedKp.secret(), publicKey: parsedKp.publicKey() };
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const serviceSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { error } = await serviceSupabase
      .from("admin_wallets")
      .upsert({
        user_id: user.id,
        secret_key: kp.secretKey,
        public_key: kp.publicKey,
        updated_at: new Date().toISOString()
      }, { onConflict: "user_id" });

    if (error) throw error;

    return NextResponse.json({ publicKey: kp.publicKey, secretKey: kp.secretKey });
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
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

    await serviceSupabase.from("admin_wallets").delete().eq("user_id", user.id);

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
