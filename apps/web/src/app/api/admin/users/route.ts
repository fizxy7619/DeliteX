import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Fetch all users who have a stellar_public_key linked, including email
  const { data, error } = await supabaseAdmin
    .from("user_profiles")
    .select("id, email, full_name, stellar_public_key")
    .not("stellar_public_key", "is", null)
    .neq("stellar_public_key", "");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ users: data });
}
