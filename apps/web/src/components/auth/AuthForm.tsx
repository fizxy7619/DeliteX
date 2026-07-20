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
            className="input"
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
          className="input"
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
          className="input"
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
        className="btn btn-primary"
        disabled={loading}
        style={{ marginTop: "4px", width: "100%", justifyContent: "center" }}
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
  fontSize: "0.8125rem",
  fontWeight: 600,
  color: "var(--color-ink-700)",
  marginBottom: "6px",
};
