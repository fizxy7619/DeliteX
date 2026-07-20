import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { generateKeypair, fundTestnetAccount, sendPayment } from "@/lib/stellar/accounts";

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => {},
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("stellar_public_key")
    .eq("id", user.id)
    .single();

  if (!profile?.stellar_public_key) {
    return NextResponse.json({ error: "No Stellar account linked" }, { status: 400 });
  }

  try {
    const { amountXlm = "500" } = await request.json().catch(() => ({}));

    // 1. Generate an ephemeral "employer" keypair
    const employer = generateKeypair();

    // 2. Fund the employer via Friendbot (gets 10,000 XLM on testnet)
    const funded = await fundTestnetAccount(employer.publicKey);
    if (!funded) {
      return NextResponse.json({ error: "Failed to fund employer account via Friendbot." }, { status: 500 });
    }

    // 3. Send payment from employer to user
    const txHash = await sendPayment({
      senderSecret: employer.secretKey,
      destinationPublicKey: profile.stellar_public_key,
      asset: "XLM",
      amount: amountXlm,
      memo: "Paycheck",
    });

    // 4. Record event in Supabase
    await supabase.from("payment_events").insert({
      user_id: user.id,
      direction: "incoming",
      bucket: "income",
      status: "completed",
      amount: parseFloat(amountXlm),
      currency: "XLM",
      counterparty: employer.publicKey,
      description: "Salary Payment",
      stellar_tx_hash: txHash,
      rail: "stellar",
    });

    return NextResponse.json({ success: true, txHash });
  } catch (err: any) {
    console.error("Simulation error:", err);
    return NextResponse.json({ error: err.message || "Simulation failed" }, { status: 500 });
  }
}
