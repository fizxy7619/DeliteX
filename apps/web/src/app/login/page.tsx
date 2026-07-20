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
        backgroundColor: "#0A0A0A",
        backgroundImage: "url('/auth-bg.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "48px 24px", backdropFilter: "blur(4px)", backgroundColor: "rgba(0,0,0,0.4)" }}>
        <div style={{ 
            width: "100%", 
            maxWidth: "460px", 
            margin: "0 auto", 
            backgroundColor: "rgba(18, 18, 18, 0.65)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            boxShadow: "0 24px 48px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)",
            borderRadius: "24px",
            padding: "48px",
            position: "relative",
            overflow: "hidden"
        }}>
          {/* Subtle gradient glow inside card */}
          <div style={{ position: "absolute", top: -100, left: -100, right: -100, height: 200, background: "radial-gradient(ellipse at top, rgba(43, 122, 90, 0.2), transparent 70%)", pointerEvents: "none" }} />
          
          <div style={{ marginBottom: "36px", position: "relative", zIndex: 1 }}>
            <Link href="/" style={{ fontFamily: "var(--font-display)", fontSize: "1.75rem", letterSpacing: "-0.02em", color: "#fff", display: "inline-block", marginBottom: "24px", textDecoration: "none" }}>
              Delite<span style={{ color: "var(--color-jade)" }}>X</span>
            </Link>
            <h1
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "2.25rem",
                color: "#fff",
                letterSpacing: "-0.02em",
                lineHeight: 1.15,
                marginBottom: "8px",
                fontWeight: 600,
              }}
            >
              Welcome back
            </h1>
            <p style={{ fontSize: "0.9375rem", color: "rgba(255, 255, 255, 0.6)", lineHeight: 1.6 }}>
              Enter your details to access your premium dashboard.
            </p>
          </div>

          <div style={{ position: "relative", zIndex: 1 }}>
            <Suspense fallback={<div style={{ color: "rgba(255,255,255,0.5)" }}>Loading secure environment…</div>}>
              <AuthForm />
            </Suspense>
          </div>
          
          <p style={{ textAlign: "center", marginTop: "32px", fontSize: "0.8125rem", color: "rgba(255,255,255,0.4)", position: "relative", zIndex: 1 }}>
            By signing in, you agree to our{" "}
            <Link href="/terms" style={{ color: "rgba(255,255,255,0.7)", textDecoration: "underline" }}>Terms</Link>
            {" "}and{" "}
            <Link href="/privacy" style={{ color: "rgba(255,255,255,0.7)", textDecoration: "underline" }}>Privacy Policy</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}
