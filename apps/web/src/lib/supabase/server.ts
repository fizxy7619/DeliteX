// lib/supabase/server.ts
// Server-side Supabase client (for API routes / Server Actions)
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

// Provide a valid dummy URL during build time to prevent Vercel build errors
// if the environment variables are missing or set to placeholder strings.
const isValidUrl = supabaseUrl.startsWith("http");
const clientUrl = isValidUrl ? supabaseUrl : "https://placeholder.supabase.co";
const clientKey = supabaseServiceKey || "placeholder-key";

// NOTE: Use the service role key ONLY in server-side contexts.
// Never expose this key to the browser.
export const supabaseAdmin = createClient(clientUrl, clientKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
