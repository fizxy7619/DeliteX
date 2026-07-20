import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import DashboardShell from "@/components/dashboard/DashboardShell";

export default async function AppPage() {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {
          // Server component — can't set cookies here; middleware handles this
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  // Double-check: middleware should catch this, but be safe
  if (!user) {
    redirect("/login");
  }

  return <DashboardShell userEmail={user.email ?? "user"} />;
}
