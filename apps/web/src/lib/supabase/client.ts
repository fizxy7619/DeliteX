import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const isValidUrl = envUrl.startsWith("http");
  const supabaseUrl = isValidUrl ? envUrl : "https://placeholder.supabase.co";
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key";

  return createBrowserClient(supabaseUrl, supabaseKey);
}
