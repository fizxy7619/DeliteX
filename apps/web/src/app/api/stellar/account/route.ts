/**
 * GET /api/stellar/account
 * Returns the authenticated user's Stellar account info + balances.
 * Creates + funds a testnet account if none exists.
 *
 * Query params:
 *   ?fund=true  — fund the account via Friendbot (testnet only)
 */
import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import {
  getAccountBalances,
  generateKeypair,
  fundTestnetAccount,
  establishTrustlines,
} from "@/lib/stellar/accounts";
import { IS_TESTNET_MODE } from "@/lib/stellar/config";

export async function GET(request: NextRequest) {
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
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch profile
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("stellar_public_key")
    .eq("id", user.id)
    .single();

  const fundParam = request.nextUrl.searchParams.get("fund") === "true";

  // If no Stellar key yet: return 404 so UI prompts connection
  if (!profile?.stellar_public_key) {
    return NextResponse.json(
      { error: "No Stellar account linked. Connect your wallet first." },
      { status: 404 }
    );
  }

  // Existing account — fund on demand
  if (fundParam && IS_TESTNET_MODE) {
    await fundTestnetAccount(profile.stellar_public_key);
  }

  const accountInfo = await getAccountBalances(profile.stellar_public_key);
  return NextResponse.json({
    publicKey: profile.stellar_public_key,
    accountInfo,
    isNew: false,
    isTestnet: IS_TESTNET_MODE,
  });
}

export async function PUT(request: NextRequest) {
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
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  if (typeof body.publicKey !== "string") {
    return NextResponse.json({ error: "publicKey must be a string" }, { status: 400 });
  }

  const { error } = await supabase
    .from("user_profiles")
    .update({ stellar_public_key: body.publicKey })
    .eq("id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, publicKey: body.publicKey });
}
