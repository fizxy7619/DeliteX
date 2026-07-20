import { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { watchPayments } from "@/lib/stellar/payments";

export const dynamic = "force-dynamic";

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
    return new Response("Unauthorized", { status: 401 });
  }

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("stellar_public_key")
    .eq("id", user.id)
    .single();

  if (!profile?.stellar_public_key) {
    return new Response("No stellar account", { status: 404 });
  }

  const publicKey = profile.stellar_public_key;

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const { close } = watchPayments(
        publicKey,
        (event) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
        },
        (err) => {
          console.error("Payment stream error:", err);
          controller.enqueue(encoder.encode(`event: error\ndata: ${err.message}\n\n`));
          // Don't close immediately on error, Horizon stream retries
        }
      );

      request.signal.addEventListener("abort", () => {
        close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}
