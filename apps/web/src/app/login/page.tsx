import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import AuthForm from "@/components/auth/AuthForm";

export const metadata: Metadata = {
  title: "Sign in — DeliteX",
};

export default function LoginPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "var(--color-bg)",
      }}
    >
      {/* Mini nav */}
      <header style={{ padding: "20px 24px", borderBottom: "1px solid var(--color-border)" }}>
        <Link href="/" style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", letterSpacing: "-0.02em", color: "var(--color-ink-900)" }}>
          Delite<span style={{ color: "var(--color-saffron)" }}>X</span>
        </Link>
      </header>

      {/* Center card */}
      <main style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "48px 24px" }}>
        <div style={{ width: "100%", maxWidth: "420px" }}>
          <div style={{ marginBottom: "32px" }}>
            <h1
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "2rem",
                color: "var(--color-ink-900)",
                letterSpacing: "-0.02em",
                lineHeight: 1.15,
                marginBottom: "10px",
              }}
            >
              Welcome back.
            </h1>
            <p style={{ fontSize: "0.9375rem", color: "var(--color-ink-500)", lineHeight: 1.6 }}>
              Sign in to your DeliteX dashboard.
            </p>
          </div>

          <div
            style={{
              backgroundColor: "#fff",
              border: "1px solid var(--color-border)",
              borderRadius: "16px",
              padding: "32px",
            }}
          >
            <Suspense fallback={<div>Loading…</div>}>
              <AuthForm />
            </Suspense>
          </div>

          <p style={{ textAlign: "center", marginTop: "24px", fontSize: "0.8125rem", color: "var(--color-ink-300)" }}>
            By signing in, you agree to our{" "}
            <Link href="/terms" style={{ color: "var(--color-ink-500)" }}>Terms</Link>
            {" "}and{" "}
            <Link href="/privacy" style={{ color: "var(--color-ink-500)" }}>Privacy Policy</Link>.
          </p>
        </div>
      </main>
    </div>
  );
}
