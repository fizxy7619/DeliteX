/**
 * Supabase Auth Proxy/Middleware for Next.js App Router (Next.js 16)
 *
 * This is THE critical file that keeps Supabase sessions alive.
 * In Next.js 16 with Turbopack, this file is named proxy.ts (not middleware.ts).
 *
 * It intercepts every non-API request, refreshes the session cookie if expired,
 * and enforces route-level auth guards.
 *
 * Without this file working correctly:
 *  - Sessions expire on Vercel (server-side getUser() returns null)
 *  - Every protected API route returns 401
 *  - AI agent, rules toggle, dashboard data — ALL fail silently
 */
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const isValidUrl = envUrl.startsWith("http");
  const supabaseUrl = isValidUrl ? envUrl : "https://placeholder.supabase.co";
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key";

  const supabase = createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: Always use getUser() to validate JWT server-side, never getSession()
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Protect /app/* routes — redirect unauthenticated users to /login
  if (pathname.startsWith("/app") && !user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Protect /admin route — require authentication
  if (pathname.startsWith("/admin") && !user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect authenticated users away from /login
  if (pathname === "/login" && user) {
    const appUrl = request.nextUrl.clone();
    appUrl.pathname = "/app";
    return NextResponse.redirect(appUrl);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - api/ (API routes handle their own auth)
     * - public assets (svg, png, jpg, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|api/).*)",
  ],
};
