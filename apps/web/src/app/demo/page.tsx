"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type Step = "idle" | "payment" | "thinking" | "proposal" | "executing" | "done";

const MOCK_PROPOSAL_ITEMS = [
  { bucket: "bills", label: "Bills & Rent", icon: "📄", amountUsdc: 200, amountInr: 16820, percent: 40, color: "#E8872A" },
  { bucket: "family", label: "Family Allowance", icon: "👨‍👩‍👧", amountUsdc: 75, amountInr: 6308, percent: 15, color: "#2B7A5A" },
  { bucket: "savings", label: "Yield Vault", icon: "🏦", amountUsdc: 100, amountInr: 8410, percent: 20, color: "#4F46E5" },
  { bucket: "income", label: "Hold in Wallet", icon: "💼", amountUsdc: 125, amountInr: 10513, percent: 25, color: "#64748B" },
];

export default function DemoPage() {
  const [step, setStep] = useState<Step>("idle");
  const [thinkingDot, setThinkingDot] = useState(0);
  const [executedItems, setExecutedItems] = useState<Set<string>>(new Set());

  // Dot animation while thinking
  useEffect(() => {
    if (step !== "thinking") return;
    const t = setInterval(() => setThinkingDot((d) => (d + 1) % 4), 400);
    return () => clearInterval(t);
  }, [step]);

  function runDemo() {
    setStep("payment");
    setExecutedItems(new Set());
    setTimeout(() => setStep("thinking"), 1400);
    setTimeout(() => setStep("proposal"), 3800);
  }

  async function executeAll() {
    setStep("executing");
    for (const item of MOCK_PROPOSAL_ITEMS) {
      await new Promise((r) => setTimeout(r, 500));
      setExecutedItems((prev) => new Set([...prev, item.bucket]));
    }
    setStep("done");
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#0D0D0D", color: "#fff", fontFamily: "var(--font-body, system-ui)" }}>
      {/* Top nav */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 50,
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        backgroundColor: "rgba(13,13,13,0.92)", backdropFilter: "blur(12px)",
        padding: "14px 32px", display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ fontSize: "1.25rem", fontWeight: 900, letterSpacing: "-0.03em" }}>DeliteX</span>
          <span style={{ padding: "3px 10px", borderRadius: "100px", backgroundColor: "rgba(255,200,0,0.15)", border: "1px solid rgba(255,200,0,0.3)", fontSize: "0.7rem", fontWeight: 700, color: "#FFD700", letterSpacing: "0.06em" }}>
            🎭 DEMO
          </span>
        </div>
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <Link href="/" style={{ fontSize: "0.875rem", color: "rgba(255,255,255,0.5)", textDecoration: "none" }}>← Back to site</Link>
          <Link href="/#waitlist" style={{ padding: "8px 20px", borderRadius: "8px", backgroundColor: "#E8872A", color: "#fff", fontSize: "0.875rem", fontWeight: 700, textDecoration: "none" }}>
            Request Access
          </Link>
        </div>
      </nav>

      <div style={{ maxWidth: "760px", margin: "0 auto", padding: "60px 24px 100px" }}>
        {/* Hero text */}
        <div style={{ textAlign: "center", marginBottom: "52px" }}>
          <p style={{ fontSize: "0.8125rem", fontWeight: 700, color: "#E8872A", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "16px" }}>
            Interactive Demo
          </p>
          <h1 style={{ fontSize: "clamp(2rem, 5vw, 3rem)", fontWeight: 900, letterSpacing: "-0.03em", lineHeight: 1.1, marginBottom: "20px" }}>
            Your AI finances,<br />on autopilot
          </h1>
          <p style={{ fontSize: "1.0625rem", color: "rgba(255,255,255,0.55)", lineHeight: 1.7, maxWidth: "520px", margin: "0 auto 36px" }}>
            Watch DeliteX receive a $500 USDC freelance payment, reason through your rules with AI, and allocate funds — all in seconds.
          </p>

          {step === "idle" && (
            <button
              onClick={runDemo}
              style={{
                padding: "16px 36px", borderRadius: "12px",
                background: "linear-gradient(135deg, #E8872A, #F5A742)",
                border: "none", cursor: "pointer", color: "#fff",
                fontSize: "1rem", fontWeight: 700, letterSpacing: "-0.01em",
                boxShadow: "0 8px 32px rgba(232,135,42,0.4)",
                transition: "transform 0.15s, box-shadow 0.15s",
              }}
              onMouseOver={e => (e.currentTarget.style.transform = "translateY(-2px)")}
              onMouseOut={e => (e.currentTarget.style.transform = "translateY(0)")}
            >
              ▶ Simulate Incoming Payment
            </button>
          )}
        </div>

        {/* Demo flow */}
        {step !== "idle" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

            {/* Step 1: Payment received */}
            <div style={{
              borderRadius: "16px", padding: "20px 24px",
              border: "1px solid rgba(255,255,255,0.1)",
              backgroundColor: "rgba(255,255,255,0.04)",
              animation: "fadeSlideUp 0.4s ease",
            }}>
              <div style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "50%", backgroundColor: "#16A34A20", border: "1px solid #16A34A40", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: "1rem" }}>
                  ⭐
                </div>
                <div>
                  <p style={{ fontWeight: 700, fontSize: "0.9375rem", color: "#fff", marginBottom: "4px" }}>
                    Payment received via Stellar
                  </p>
                  <p style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,0.5)" }}>
                    $500.00 USDC · from Acme Corp · txhash: a8f2c1d…
                  </p>
                  <p style={{ fontSize: "0.8125rem", color: "#16A34A", marginTop: "4px", fontWeight: 600 }}>
                    ≈ ₹42,050 at ₹84.1/USDC · settled in 4s
                  </p>
                </div>
                <span style={{ marginLeft: "auto", fontSize: "0.75rem", padding: "3px 10px", borderRadius: "100px", backgroundColor: "#16A34A20", color: "#16A34A", fontWeight: 700, flexShrink: 0 }}>CONFIRMED</span>
              </div>
            </div>

            {/* Step 2: AI thinking */}
            {(step === "thinking" || step === "proposal" || step === "executing" || step === "done") && (
              <div style={{
                borderRadius: "16px", padding: "20px 24px",
                border: "1px solid rgba(232,135,42,0.2)",
                backgroundColor: "rgba(232,135,42,0.05)",
                animation: "fadeSlideUp 0.4s ease",
              }}>
                <div style={{ display: "flex", gap: "14px", alignItems: "center" }}>
                  <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "linear-gradient(135deg, #E8872A, #F5A742)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: "0.9rem", fontWeight: 900 }}>
                    ✦
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 700, fontSize: "0.9375rem", color: "#fff", marginBottom: "2px" }}>
                      {step === "thinking" ? `NVIDIA Nemotron reasoning${".".repeat(thinkingDot)}` : "AI analysis complete"}
                    </p>
                    <p style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,0.5)" }}>
                      {step === "thinking"
                        ? "Reading your rules, upcoming bills, family allowances…"
                        : "Applied Default Allocation rule · 4 line items generated · 1.2s"}
                    </p>
                  </div>
                  {step === "thinking" && (
                    <div style={{ width: "20px", height: "20px", border: "2px solid rgba(255,255,255,0.2)", borderTopColor: "#E8872A", borderRadius: "50%", animation: "spin 0.8s linear infinite", flexShrink: 0 }} />
                  )}
                </div>
              </div>
            )}

            {/* Step 3: Proposal */}
            {(step === "proposal" || step === "executing" || step === "done") && (
              <div style={{
                borderRadius: "16px", border: "1px solid rgba(255,255,255,0.1)",
                backgroundColor: "rgba(255,255,255,0.04)",
                overflow: "hidden",
                animation: "fadeSlideUp 0.4s ease",
              }}>
                <div style={{ padding: "20px 24px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
                    <div>
                      <p style={{ fontWeight: 700, fontSize: "0.9375rem", color: "#fff", marginBottom: "2px" }}>Proposed Allocation</p>
                      <p style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,0.4)" }}>$500.00 USDC · awaiting approval</p>
                    </div>
                    {step === "proposal" && (
                      <button
                        onClick={executeAll}
                        style={{
                          padding: "10px 22px", borderRadius: "8px",
                          background: "linear-gradient(135deg, #E8872A, #F5A742)",
                          border: "none", cursor: "pointer", color: "#fff",
                          fontSize: "0.875rem", fontWeight: 700,
                        }}
                      >
                        ✓ Approve & Execute
                      </button>
                    )}
                    {step === "done" && (
                      <span style={{ padding: "6px 16px", borderRadius: "100px", backgroundColor: "#16A34A20", color: "#16A34A", fontWeight: 700, fontSize: "0.8125rem" }}>
                        ✓ All Executed
                      </span>
                    )}
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
                  {MOCK_PROPOSAL_ITEMS.map((item, i) => {
                    const executed = executedItems.has(item.bucket);
                    return (
                      <div
                        key={item.bucket}
                        style={{
                          display: "flex", justifyContent: "space-between", alignItems: "center",
                          padding: "16px 24px",
                          borderBottom: i < MOCK_PROPOSAL_ITEMS.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none",
                          transition: "background-color 0.3s",
                          backgroundColor: executed ? "rgba(22,163,74,0.05)" : "transparent",
                          flexWrap: "wrap", gap: "8px",
                        }}
                      >
                        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                          <span style={{ fontSize: "1.1rem" }}>{item.icon}</span>
                          <div>
                            <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "#fff" }}>{item.label}</p>
                            <p style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)" }}>{item.percent}% of payment</p>
                          </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                          <div style={{ textAlign: "right" }}>
                            <p style={{ fontWeight: 700, fontSize: "1rem", color: item.color }}>${item.amountUsdc}</p>
                            <p style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.35)" }}>₹{item.amountInr.toLocaleString("en-IN")}</p>
                          </div>
                          {executed && <span style={{ fontSize: "0.75rem", color: "#16A34A", fontWeight: 700 }}>✓ Done</span>}
                          {step === "executing" && !executed && (
                            <div style={{ width: "14px", height: "14px", border: "2px solid rgba(255,255,255,0.2)", borderTopColor: "#E8872A", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Step 4: Done CTA */}
            {step === "done" && (
              <div style={{ animation: "fadeSlideUp 0.4s ease", textAlign: "center", paddingTop: "16px" }}>
                <p style={{ fontSize: "1.0625rem", fontWeight: 700, color: "#fff", marginBottom: "8px" }}>
                  🎉 $500 allocated in 5 seconds, automatically
                </p>
                <p style={{ fontSize: "0.875rem", color: "rgba(255,255,255,0.5)", marginBottom: "28px" }}>
                  Bills queued · Family transfers initiated · $100 USDC earning yield in Soroban vault
                </p>
                <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
                  <Link href="/#waitlist" style={{ padding: "14px 28px", borderRadius: "10px", background: "linear-gradient(135deg, #E8872A, #F5A742)", color: "#fff", fontWeight: 700, textDecoration: "none", fontSize: "0.9375rem" }}>
                    Join Early Access →
                  </Link>
                  <button
                    onClick={() => { setStep("idle"); setExecutedItems(new Set()); }}
                    style={{ padding: "14px 28px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.15)", backgroundColor: "transparent", color: "rgba(255,255,255,0.7)", cursor: "pointer", fontFamily: "var(--font-body)", fontSize: "0.9375rem" }}
                  >
                    ↺ Run Again
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Feature pills at bottom */}
        <div style={{ marginTop: "72px", display: "flex", flexWrap: "wrap", gap: "10px", justifyContent: "center" }}>
          {[
            "⭐ Stellar blockchain", "🤖 NVIDIA Nemotron AI", "🏦 Soroban yield vault",
            "💸 x402 payments", "🇮🇳 UPI & NEFT", "🔐 Non-custodial",
          ].map((f) => (
            <span key={f} style={{ padding: "6px 14px", borderRadius: "100px", border: "1px solid rgba(255,255,255,0.12)", fontSize: "0.8125rem", color: "rgba(255,255,255,0.5)" }}>
              {f}
            </span>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
