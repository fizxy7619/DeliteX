"use client";

import { useState, FormEvent } from "react";

type Status = "idle" | "loading" | "success" | "error" | "duplicate";

export default function WaitlistForm({ variant = "default" }: { variant?: "default" | "inline" }) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email) return;

    setStatus("loading");
    setMessage("");

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name }),
      });

      const data = await res.json();

      if (res.ok) {
        setStatus("success");
        setMessage(data.message ?? "You're on the list!");
        setEmail("");
        setName("");
      } else if (res.status === 409) {
        setStatus("duplicate");
        setMessage(data.error ?? "Already on the list!");
      } else {
        setStatus("error");
        setMessage(data.error ?? "Something went wrong. Please try again.");
      }
    } catch {
      setStatus("error");
      setMessage("Network error. Please check your connection and try again.");
    }
  }

  if (status === "success") {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          gap: "10px",
          padding: "24px 28px",
          border: "1px solid rgba(43,122,90,0.3)",
          borderRadius: "12px",
          backgroundColor: "var(--color-jade-light)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-jade)" strokeWidth="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          <span style={{ fontWeight: 600, fontSize: "0.9375rem", color: "var(--color-jade)" }}>
            You&rsquo;re on the list!
          </span>
        </div>
        <p style={{ fontSize: "0.875rem", color: "var(--color-ink-700)", lineHeight: 1.6 }}>
          {message} We&rsquo;ll send you early access details before anyone else.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "12px",
        }}
      >
        {variant === "default" && (
          <input
            type="text"
            className="input"
            placeholder="Your name (optional)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={status === "loading"}
          />
        )}

        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <input
            id="waitlist-email"
            type="email"
            className={`input ${status === "error" ? "error" : ""}`}
            placeholder="Work email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={status === "loading"}
            style={{ flex: "1 1 220px" }}
            aria-label="Email address"
          />
          <button
            type="submit"
            className="btn btn-saffron"
            disabled={status === "loading" || !email}
            style={{ flexShrink: 0 }}
          >
            {status === "loading" ? (
              <>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  style={{ animation: "spin 1s linear infinite" }}
                >
                  <line x1="12" y1="2" x2="12" y2="6" />
                  <line x1="12" y1="18" x2="12" y2="22" />
                  <line x1="4.93" y1="4.93" x2="7.76" y2="7.76" />
                  <line x1="16.24" y1="16.24" x2="19.07" y2="19.07" />
                  <line x1="2" y1="12" x2="6" y2="12" />
                  <line x1="18" y1="12" x2="22" y2="12" />
                  <line x1="4.93" y1="19.07" x2="7.76" y2="16.24" />
                  <line x1="16.24" y1="7.76" x2="19.07" y2="4.93" />
                </svg>
                Joining…
              </>
            ) : (
              "Request access"
            )}
          </button>
        </div>

        {(status === "error" || status === "duplicate") && (
          <p
            style={{
              fontSize: "0.8125rem",
              color: status === "duplicate" ? "var(--color-jade)" : "#D0342C",
              marginTop: "4px",
            }}
          >
            {message}
          </p>
        )}

        <p style={{ fontSize: "0.75rem", color: "var(--color-ink-300)", marginTop: "2px" }}>
          No spam, ever. Unsubscribe anytime.
        </p>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </form>
  );
}
