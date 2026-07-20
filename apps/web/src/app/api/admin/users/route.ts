import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Fetch all user_profiles that have a stellar_public_key
  const { data: profiles, error: profilesErr } = await supabaseAdmin
    .from("user_profiles")
    .select("id, full_name, stellar_public_key")
    .not("stellar_public_key", "is", null)
    .neq("stellar_public_key", "");

  if (profilesErr) {
    return NextResponse.json({ error: profilesErr.message }, { status: 500 });
  }

  if (!profiles || profiles.length === 0) {
    return NextResponse.json({ users: [] });
  }

  // Get emails from auth.users using service role admin API
  const { data: authData, error: authErr } = await supabaseAdmin.auth.admin.listUsers();

  if (authErr) {
    // Fallback: return profiles without email
    const users = profiles.map((p) => ({
      id: p.id,
      email: "—",
      full_name: p.full_name || "Unknown",
      stellar_public_key: p.stellar_public_key,
    }));
    return NextResponse.json({ users });
  }

  // Map auth emails to profiles
  const authUserMap: Record<string, string> = {};
  for (const u of authData.users) {
    authUserMap[u.id] = u.email ?? "—";
  }

  const users = profiles.map((p) => ({
    id: p.id,
    email: authUserMap[p.id] || "—",
    full_name: p.full_name || "Unknown",
    stellar_public_key: p.stellar_public_key,
  }));

  return NextResponse.json({ users });
}
