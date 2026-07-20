"use client";

import { useState } from "react";
import { MOCK_VAULT } from "@/lib/mock-data";

export default function SavingsView() {
  const vault = MOCK_VAULT;
  const [depositAmount, setDepositAmount] = useState("");

  const inrPerUsdc = 84.1;
  const totalInr = vault.totalValueUsdc * inrPerUsdc;
  const yieldPct = ((vault.yieldEarnedUsdc / vault.principalUsdc) * 100).toFixed(2);

  // Simulated monthly projection
  const monthlyYield = (vault.totalValueUsdc * (vault.estimatedApyPercent / 100) / 12).toFixed(2);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
      {/* Header */}
      <div>
        <p className="text-label" style={{ marginBottom: "8px" }}>Savings</p>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "2rem", color: "var(--color-ink-900)", letterSpacing: "-0.02em" }}>
          Yield vault
        </h2>
      </div>

      {/* Vault overview */}
      <div
        style={{
          border: "1px solid var(--color-border)", borderRadius: "16px", overflow: "hidden",
          backgroundColor: "#fff",
        }}
      >
        {/* Top: vault balance */}
        <div style={{ padding: "32px", borderBottom: "1px solid var(--color-border)", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "24px" }}>
          <div>
            <p style={{ fontSize: "0.8125rem", color: "var(--color-ink-500)", marginBottom: "8px" }}>Total vault value</p>
            <p style={{ fontFamily: "var(--font-display)", fontSize: "3rem", color: "var(--color-ink-900)", lineHeight: 1, letterSpacing: "-0.02em" }}>
              ${vault.totalValueUsdc.toFixed(2)}
              <span style={{ fontSize: "1rem", fontFamily: "var(--font-body)", color: "var(--color-ink-500)", marginLeft: "8px" }}>USDC</span>
            </p>
            <p style={{ fontSize: "0.875rem", color: "var(--color-ink-500)", marginTop: "8px" }}>
              ≈ ₹{Math.round(totalInr).toLocaleString("en-IN")}
            </p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", justifyContent: "center" }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: "8px",
              backgroundColor: "#F0FDF4", border: "1px solid rgba(22,163,74,0.2)",
              borderRadius: "100px", padding: "8px 16px",
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.5"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/></svg>
              <span style={{ fontWeight: 700, fontSize: "0.875rem", color: "#16A34A" }}>{vault.estimatedApyPercent}% APY</span>
            </div>
            <p style={{ fontSize: "0.8125rem", color: "var(--color-ink-500)", textAlign: "right" }}>
              ~${monthlyYield} USDC/month
            </p>
          </div>
        </div>

        {/* Metrics grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", borderBottom: "1px solid var(--color-border)" }}>
          {[
            { label: "Principal", value: `$${vault.principalUsdc.toFixed(2)}` },
            { label: "Yield earned", value: `+$${vault.yieldEarnedUsdc.toFixed(2)}` },
            { label: "Return", value: `+${yieldPct}%` },
          ].map((m, i) => (
            <div
              key={m.label}
              style={{
                padding: "20px 24px",
                borderRight: i < 2 ? "1px solid var(--color-border)" : "none",
              }}
            >
              <p style={{ fontSize: "0.75rem", color: "var(--color-ink-500)", marginBottom: "6px" }}>{m.label}</p>
              <p style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", color: m.label === "Yield earned" || m.label === "Return" ? "#16A34A" : "var(--color-ink-900)" }}>
                {m.value}
              </p>
            </div>
          ))}
        </div>

        {/* Auto-deposit setting */}
        <div style={{ padding: "24px 28px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
            <div>
              <p style={{ fontWeight: 600, fontSize: "0.875rem", color: "var(--color-ink-900)", marginBottom: "4px" }}>
                Auto-deposit surplus
              </p>
              <p style={{ fontSize: "0.8125rem", color: "var(--color-ink-500)" }}>
                When cash balance exceeds ₹{vault.autoDepositThresholdInr?.toLocaleString("en-IN")}, surplus goes to vault
              </p>
            </div>
            <div style={{
              padding: "6px 12px", borderRadius: "100px", fontSize: "0.8125rem", fontWeight: 600,
              backgroundColor: vault.autoDepositEnabled ? "var(--color-jade-light)" : "var(--color-bg)",
              color: vault.autoDepositEnabled ? "var(--color-jade)" : "var(--color-ink-500)",
              border: `1px solid ${vault.autoDepositEnabled ? "rgba(43,122,90,0.3)" : "var(--color-border)"}`,
            }}>
              {vault.autoDepositEnabled ? "Enabled" : "Disabled"}
            </div>
          </div>
        </div>
      </div>

      {/* Quick deposit */}
      <div className="card">
        <p style={{ fontWeight: 600, fontSize: "0.9375rem", color: "var(--color-ink-900)", marginBottom: "16px" }}>
          Manual deposit
        </p>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <input
            type="number"
            className="input"
            placeholder="Amount in USDC"
            value={depositAmount}
            onChange={(e) => setDepositAmount(e.target.value)}
            style={{ flex: "1 1 200px" }}
            min="1"
          />
          <button className="btn btn-primary" style={{ flexShrink: 0 }}>
            Deposit to vault
          </button>
        </div>
        <p style={{ fontSize: "0.75rem", color: "var(--color-ink-300)", marginTop: "10px" }}>
          Phase 3: This will call the Soroban vault contract. Currently a UI stub.
        </p>
      </div>

      {/* Contract info stub */}
      <div style={{ padding: "16px 20px", border: "1px dashed var(--color-border)", borderRadius: "10px" }}>
        <p style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--color-ink-700)", marginBottom: "4px" }}>
          Soroban vault contract
        </p>
        <p style={{ fontSize: "0.8125rem", color: "var(--color-ink-300)", fontFamily: "monospace" }}>
          {vault.sorobanContractId ?? "Not deployed · Phase 3"}
        </p>
      </div>
    </div>
  );
}
