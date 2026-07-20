"use client";

import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";

type Mode = "login" | "signup";

export default function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") ?? "/app";

  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const supabase = createClient();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(error.message);
      } else {
        router.push(redirectTo);
        router.refresh();
      }
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) {
        setError(error.message);
      } else {
        setSuccess(
          "Check your email to confirm your account, then come back to log in."
        );
      }
    }

    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {mode === "signup" && (
        <div>
          <label style={labelStyle} htmlFor="full-name">Full name</label>
          <input
            id="full-name"
            type="text"
            style={inputStyle}
            placeholder="Rahul Sharma"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            disabled={loading}
          />
        </div>
      )}

      <div>
        <label style={labelStyle} htmlFor="email">Email address</label>
        <input
          id="email"
          type="email"
          style={inputStyle}
          placeholder="rahul@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={loading}
        />
      </div>

      <div>
        <label style={labelStyle} htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          style={inputStyle}
          placeholder={mode === "signup" ? "Min. 8 characters" : "••••••••"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          disabled={loading}
        />
      </div>

      {error && (
        <p style={{ fontSize: "0.875rem", color: "#C0392B", lineHeight: 1.5 }}>{error}</p>
      )}
      {success && (
        <p style={{ fontSize: "0.875rem", color: "var(--color-jade)", lineHeight: 1.5 }}>{success}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        style={{ 
          marginTop: "12px", 
          width: "100%", 
          justifyContent: "center",
          backgroundColor: "var(--color-jade)",
          color: "#fff",
          border: "none",
          padding: "14px 20px",
          borderRadius: "12px",
          fontSize: "0.9375rem",
          fontWeight: 600,
          cursor: loading ? "not-allowed" : "pointer",
          opacity: loading ? 0.7 : 1,
          transition: "transform 0.15s, opacity 0.15s",
          boxShadow: "0 4px 12px rgba(43,122,90,0.3)"
        }}
        onMouseOver={(e) => { if(!loading) e.currentTarget.style.transform = "translateY(-1px)" }}
        onMouseOut={(e) => { if(!loading) e.currentTarget.style.transform = "none" }}
      >
        {loading ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
      </button>

      <p style={{ textAlign: "center", fontSize: "0.875rem", color: "var(--color-ink-500)" }}>
        {mode === "login" ? "Don't have an account? " : "Already have an account? "}
        <button
          type="button"
          onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(null); setSuccess(null); }}
          style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-saffron)", fontWeight: 600, textDecoration: "underline", fontSize: "inherit" }}
        >
          {mode === "login" ? "Sign up" : "Sign in"}
        </button>
      </p>
    </form>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "0.75rem",
  fontWeight: 600,
  color: "rgba(255, 255, 255, 0.7)",
  marginBottom: "8px",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "14px 16px",
  backgroundColor: "rgba(0, 0, 0, 0.2)",
  border: "1px solid rgba(255, 255, 255, 0.1)",
  borderRadius: "12px",
  color: "#fff",
  fontSize: "1rem",
  outline: "none",
  transition: "border-color 0.2s, background-color 0.2s",
};
