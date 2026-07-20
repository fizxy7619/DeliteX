"use client";

import { useState, useEffect, useCallback } from "react";
import { isConnected, getPublicKey } from "@stellar/freighter-api";

interface StellarBalance {
  asset: string;
  balance: string;
  issuer?: string;
}

interface AccountInfo {
  publicKey: string;
  balances: StellarBalance[];
  isTestnet: boolean;
  explorerUrl: string;
  isNew?: boolean;
}

interface FxQuote {
  usdcAmount: number;
  inrAmount: number;
  exchangeRate: number;
  spread: number;
  feeInr: number;
}

function BalanceBadge({ balance }: { balance: StellarBalance }) {
  const assetColors: Record<string, { bg: string; fg: string }> = {
    XLM: { bg: "#EEF2FF", fg: "#4F46E5" },
    USDC: { bg: "var(--color-jade-light)", fg: "var(--color-jade)" },
    EURC: { bg: "var(--color-saffron-light)", fg: "var(--color-saffron)" },
  };
  const c = assetColors[balance.asset] ?? { bg: "var(--color-bg)", fg: "var(--color-ink-700)" };

  return (
    <div
      style={{
        display: "flex", flexDirection: "column", gap: "4px",
        padding: "16px 20px", backgroundColor: c.bg, borderRadius: "12px",
        border: `1px solid ${c.fg}22`,
        minWidth: "140px",
      }}
    >
      <p style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", color: c.fg }}>
        {balance.asset}
      </p>
      <p style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", color: "var(--color-ink-900)" }}>
        {parseFloat(balance.balance).toLocaleString("en-US", { maximumFractionDigits: 4 })}
      </p>
    </div>
  );
}

export default function StellarView() {
  const [account, setAccount] = useState<AccountInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [funding, setFunding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quote, setQuote] = useState<FxQuote | null>(null);
  const [x402Demo, setX402Demo] = useState<{ status: string; detail: string } | null>(null);
  const [x402Loading, setX402Loading] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [connecting, setConnecting] = useState(false);

  const fetchAccount = useCallback(async (fund = false) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/stellar/account${fund ? "?fund=true" : ""}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load account");
      setAccount(data.accountInfo ? { ...data.accountInfo, isNew: data.isNew } : null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchQuote = useCallback(async () => {
    try {
      const res = await fetch("/api/onramp/quote?usdcAmount=100");
      if (res.ok) setQuote(await res.json());
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    fetchAccount();
    fetchQuote();
  }, [fetchAccount, fetchQuote]);

  useEffect(() => {
    if (!account?.publicKey) return;
    const sse = new EventSource("/api/stellar/stream");
    sse.onmessage = (event) => {
      console.log("New payment received:", event.data);
      // Auto-refresh balances when a payment comes in
      fetchAccount();
    };
    return () => sse.close();
  }, [account?.publicKey, fetchAccount]);

  async function handleFund() {
    setFunding(true);
    await fetchAccount(true);
    setFunding(false);
  }

  async function connectFreighter() {
    setConnecting(true);
    setError(null);
    try {
      if (!(await isConnected())) {
        throw new Error("Freighter wallet not installed or unavailable.");
      }
      const pubKey = await getPublicKey();
      const res = await fetch("/api/stellar/account", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publicKey: pubKey }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to save public key");
      await fetchAccount();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setConnecting(false);
    }
  }

  async function demoX402() {
    setX402Loading(true);
    setX402Demo(null);
    try {
      // Step 1: Call without payment → expect 402
      const res1 = await fetch("/api/x402/pay-bill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ billId: "bill_demo_001" }),
      });
      if (res1.status !== 402) {
        setX402Demo({ status: "error", detail: `Expected 402, got ${res1.status}` });
        return;
      }
      const payReq = await res1.json();

      // Step 2: "Pay" by calling again with X-Payment stub header
      const stubPaymentHeader = Buffer.from(JSON.stringify({ scheme: "exact", payload: "stub_xdr" })).toString("base64");
      const res2 = await fetch("/api/x402/pay-bill", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Payment": stubPaymentHeader,
        },
        body: JSON.stringify({ billId: "bill_demo_001", nonce: payReq.accepts?.[0]?.nonce ?? "" }),
      });
      const result = await res2.json();
      setX402Demo({
        status: res2.ok ? "success" : "error",
        detail: res2.ok
          ? `✓ Bill paid! tx: ${result.txHash ?? result.txHash} (stub)`
          : result.error,
      });
    } catch (e) {
      setX402Demo({ status: "error", detail: (e as Error).message });
    } finally {
      setX402Loading(false);
    }
  }

  function copyAddress() {
    if (account?.publicKey) {
      navigator.clipboard.writeText(account.publicKey);
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 1500);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
      {/* Header */}
      <div>
        <p className="text-label" style={{ marginBottom: "8px" }}>Stellar</p>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "2rem", color: "var(--color-ink-900)", letterSpacing: "-0.02em" }}>
          Testnet integration
        </h2>
        <p style={{ fontSize: "0.875rem", color: "var(--color-ink-500)", marginTop: "6px" }}>
          Your Stellar account on the test network. No real funds — safe to experiment.
        </p>
      </div>

      {/* Testnet Banner */}
      <div style={{
        display: "flex", alignItems: "center", gap: "10px", padding: "10px 16px",
        backgroundColor: "#FFFBEB", borderRadius: "8px", border: "1px solid rgba(234,179,8,0.35)"
      }}>
        <span style={{ fontSize: "1rem" }}>🧪</span>
        <p style={{ fontSize: "0.8125rem", color: "#92400E" }}>
          <strong>Testnet only.</strong> Balances use test XLM and USDC. Production integration requires KYC + mainnet deployment.
        </p>
      </div>

      {/* Account Card */}
      {loading ? (
        <div className="card" style={{ padding: "40px", textAlign: "center", color: "var(--color-ink-300)" }}>
          Loading Stellar account…
        </div>
      ) : error ? (
        <div className="card" style={{ padding: "24px", color: "#C0392B" }}>
          <p style={{ fontWeight: 600 }}>Error</p>
          <p style={{ fontSize: "0.875rem", marginTop: "4px" }}>{error}</p>
          <button className="btn btn-ghost" onClick={() => fetchAccount()} style={{ marginTop: "12px" }}>Retry</button>
        </div>
      ) : account ? (
        <div className="card" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Public key */}
          <div>
            <p style={{ fontSize: "0.75rem", color: "var(--color-ink-500)", marginBottom: "6px" }}>
              Stellar account · {account.isTestnet ? "Testnet" : "Mainnet"}
              {account.isNew && (
                <span style={{ marginLeft: "8px", color: "var(--color-jade)", fontWeight: 700 }}>✨ Just created</span>
              )}
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
              <code style={{
                fontSize: "0.8125rem", color: "var(--color-ink-700)",
                backgroundColor: "var(--color-bg)", padding: "6px 12px", borderRadius: "6px",
                border: "1px solid var(--color-border)", wordBreak: "break-all",
              }}>
                {account.publicKey}
              </code>
              <button
                onClick={copyAddress}
                style={{
                  padding: "6px 12px", border: "1px solid var(--color-border)", borderRadius: "6px",
                  backgroundColor: "transparent", cursor: "pointer", fontSize: "0.8125rem",
                  color: "var(--color-ink-700)", fontFamily: "var(--font-body)",
                  transition: "background 0.15s",
                  flexShrink: 0,
                }}
              >
                {copyFeedback ? "✓ Copied" : "Copy"}
              </button>
              <a
                href={account.explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: "0.8125rem", color: "var(--color-jade)", textDecoration: "none" }}
              >
                View on Explorer ↗
              </a>
            </div>
          </div>

          {/* Balances */}
          <div>
            <p style={{ fontSize: "0.75rem", color: "var(--color-ink-500)", marginBottom: "10px" }}>Balances</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
              {account.balances.length > 0 ? (
                account.balances.map((b) => <BalanceBadge key={b.asset} balance={b} />)
              ) : (
                <p style={{ fontSize: "0.875rem", color: "var(--color-ink-300)" }}>Account not funded yet.</p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <button
              onClick={handleFund}
              disabled={funding}
              className="btn btn-primary"
              style={{ fontSize: "0.875rem" }}
            >
              {funding ? "Funding…" : "🚰 Fund via Friendbot"}
            </button>
            <button onClick={() => fetchAccount()} className="btn btn-ghost" style={{ fontSize: "0.875rem" }}>
              ↻ Refresh balances
            </button>
          </div>
        </div>
      ) : (
        <div className="card" style={{ padding: "40px", textAlign: "center" }}>
          <p style={{ color: "var(--color-ink-500)" }}>No Stellar account linked.</p>
          <div style={{ display: "flex", gap: "10px", justifyContent: "center", marginTop: "16px", flexWrap: "wrap" }}>
            <button onClick={() => fetchAccount()} className="btn btn-primary">
              Create testnet account
            </button>
            <button onClick={connectFreighter} disabled={connecting} className="btn btn-ghost" style={{ border: "1px solid var(--color-border)" }}>
              {connecting ? "Connecting..." : "Connect Freighter"}
            </button>
          </div>
        </div>
      )}

      {/* FX Quote */}
      {quote && (
        <div className="card">
          <p style={{ fontWeight: 600, fontSize: "0.9375rem", color: "var(--color-ink-900)", marginBottom: "16px" }}>
            Live FX Quote (USDC → INR)
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "16px" }}>
            {[
              { label: "Rate", value: `₹${quote.exchangeRate.toFixed(2)}` },
              { label: "Spread", value: `${quote.spread}%` },
              { label: "Fee (₹)", value: `₹${quote.feeInr.toFixed(2)}` },
              { label: "You receive", value: `₹${quote.inrAmount.toFixed(0)}` },
            ].map((q) => (
              <div key={q.label}>
                <p style={{ fontSize: "0.75rem", color: "var(--color-ink-500)", marginBottom: "4px" }}>{q.label}</p>
                <p style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", color: "var(--color-ink-900)" }}>{q.value}</p>
              </div>
            ))}
          </div>
          <p style={{ fontSize: "0.75rem", color: "var(--color-ink-300)", marginTop: "12px" }}>
            For 100 USDC · via Onramp.money (stub) · 30-second quote
          </p>
        </div>
      )}

      {/* x402 Demo */}
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <p style={{ fontWeight: 600, fontSize: "0.9375rem", color: "var(--color-ink-900)", marginBottom: "4px" }}>
              x402 Agentic Payment Demo
            </p>
            <p style={{ fontSize: "0.8125rem", color: "var(--color-ink-500)", lineHeight: 1.6, maxWidth: "480px" }}>
              Simulates the AI agent paying a bill via the x402 protocol.
              Calls <code style={{ backgroundColor: "var(--color-bg)", padding: "1px 6px", borderRadius: "4px" }}>POST /api/x402/pay-bill</code>,
              handles the 402 response, and retries with a payment header.
            </p>
          </div>
          <button
            onClick={demoX402}
            disabled={x402Loading}
            className="btn btn-saffron"
            style={{ flexShrink: 0 }}
          >
            {x402Loading ? "Running…" : "▶ Run Demo"}
          </button>
        </div>

        {x402Demo && (
          <div style={{
            marginTop: "16px", padding: "14px 16px", borderRadius: "8px",
            backgroundColor: x402Demo.status === "success" ? "var(--color-jade-light)" : "#FEF2F2",
            border: `1px solid ${x402Demo.status === "success" ? "rgba(43,122,90,0.3)" : "rgba(192,57,43,0.3)"}`,
          }}>
            <p style={{
              fontSize: "0.875rem", fontFamily: "monospace",
              color: x402Demo.status === "success" ? "var(--color-jade)" : "#C0392B",
            }}>
              {x402Demo.detail}
            </p>
          </div>
        )}
      </div>

      {/* Contracts */}
      <div className="card">
        <p style={{ fontWeight: 600, fontSize: "0.9375rem", color: "var(--color-ink-900)", marginBottom: "16px" }}>
          Soroban contracts (Phase 3)
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {[
            { name: "Router Contract", id: process.env.NEXT_PUBLIC_SOROBAN_ROUTER ?? "Not deployed", desc: "Splits incoming payments per AllocationRule" },
            { name: "Vault Contract", id: process.env.NEXT_PUBLIC_SOROBAN_VAULT ?? "Not deployed", desc: "ERC-4626 USDC yield vault" },
          ].map((c) => (
            <div key={c.name} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "12px 16px", backgroundColor: "var(--color-bg)", borderRadius: "8px",
              border: "1px solid var(--color-border)", flexWrap: "wrap", gap: "8px"
            }}>
              <div>
                <p style={{ fontWeight: 600, fontSize: "0.875rem", color: "var(--color-ink-900)" }}>{c.name}</p>
                <p style={{ fontSize: "0.75rem", color: "var(--color-ink-500)", marginTop: "2px" }}>{c.desc}</p>
              </div>
              <code style={{ fontSize: "0.75rem", color: "var(--color-ink-300)", fontFamily: "monospace" }}>
                {c.id}
              </code>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
