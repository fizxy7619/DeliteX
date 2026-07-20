/**
 * GET /api/stellar/payments?limit=20
 * Returns recent Stellar payment events for the authenticated user.
 */
import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getRecentPayments } from "@/lib/stellar/payments";

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
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("stellar_public_key")
    .eq("id", user.id)
    .single();

  if (!profile?.stellar_public_key) {
    return NextResponse.json({ payments: [], message: "No Stellar account linked" });
  }

  const limit = Math.min(parseInt(request.nextUrl.searchParams.get("limit") ?? "20", 10), 100);
  const payments = await getRecentPayments(profile.stellar_public_key, limit);

  return NextResponse.json({ payments, publicKey: profile.stellar_public_key });
}
