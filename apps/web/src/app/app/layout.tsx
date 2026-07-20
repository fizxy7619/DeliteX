import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard — DeliteX",
  description: "Your agentic wallet dashboard",
};

// The /app route is purely a shell — no layout wrapper needed here.
// Auth is enforced by middleware.ts.
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
