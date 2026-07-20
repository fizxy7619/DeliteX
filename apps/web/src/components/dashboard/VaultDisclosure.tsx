"use client";

import { useState } from "react";
import { VAULT_STRATEGIES, type VaultStrategyConfig } from "@/lib/vault/soroban-vault";

interface VaultDisclosureProps {
  selectedStrategy: VaultStrategyConfig;
}

export default function VaultDisclosure({ selectedStrategy }: VaultDisclosureProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      style={{
        borderRadius: "12px",
        border: `1px solid ${selectedStrategy.riskLevel === "low" ? "rgba(22,163,74,0.25)" : "rgba(217,119,6,0.25)"}`,
        backgroundColor: selectedStrategy.riskLevel === "low" ? "#F0FDF4" : "#FFFBEB",
        overflow: "hidden",
        transition: "all 0.2s ease",
      }}
    >
      <div style={{ padding: "16px 20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "1.1rem" }}>
              {selectedStrategy.riskLevel === "low" ? "🟢" : "🟡"}
            </span>
            <div>
              <p style={{ fontWeight: 700, fontSize: "0.875rem", color: "var(--color-ink-900)" }}>
                {selectedStrategy.riskLevel === "low" ? "Low Risk" : "Medium Risk"} · {selectedStrategy.label} Strategy
              </p>
              <p style={{ fontSize: "0.8125rem", color: "var(--color-ink-500)", marginTop: "2px" }}>
                {selectedStrategy.mechanism}
              </p>
            </div>
          </div>
          <button
            onClick={() => setExpanded((p) => !p)}
            style={{
              background: "none", border: "none", cursor: "pointer",
              fontSize: "0.8125rem", color: "var(--color-ink-400)",
              display: "flex", alignItems: "center", gap: "4px", flexShrink: 0,
              fontFamily: "var(--font-body)", padding: "2px 0",
            }}
            aria-expanded={expanded}
            aria-controls="vault-disclosure-body"
          >
            {expanded ? "Hide" : "How it works"} <span style={{ fontSize: "0.7rem" }}>{expanded ? "▲" : "▼"}</span>
          </button>
        </div>

        {expanded && (
          <div
            id="vault-disclosure-body"
            style={{
              marginTop: "14px", paddingTop: "14px",
              borderTop: `1px solid ${selectedStrategy.riskLevel === "low" ? "rgba(22,163,74,0.15)" : "rgba(217,119,6,0.15)"}`,
            }}
          >
            <p style={{ fontSize: "0.8125rem", color: "var(--color-ink-600)", lineHeight: 1.65, marginBottom: "12px" }}>
              {selectedStrategy.disclosure}
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {[
                { icon: "🔐", text: "Non-custodial — only you control your keys" },
                { icon: "🧪", text: "Testnet only — no real funds are moved" },
                { icon: "📜", text: "Soroban smart contract audit pending" },
                { icon: "⚡", text: `Estimated APY: ${selectedStrategy.apyMin}%–${selectedStrategy.apyMax}%` },
              ].map((item) => (
                <div key={item.text} style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
                  <span style={{ flexShrink: 0 }}>{item.icon}</span>
                  <p style={{ fontSize: "0.8125rem", color: "var(--color-ink-500)" }}>{item.text}</p>
                </div>
              ))}
            </div>

            <div style={{
              marginTop: "12px", padding: "10px 12px",
              backgroundColor: "rgba(0,0,0,0.04)", borderRadius: "8px",
            }}>
              <p style={{ fontSize: "0.75rem", color: "var(--color-ink-400)", lineHeight: 1.6 }}>
                <strong>Disclaimer:</strong> Yield products carry risks including smart contract vulnerabilities,
                liquidity risk, and platform risk. Past performance does not guarantee future returns.
                DeliteX is not a registered investment advisor. This is not financial advice.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Strategies comparison */}
      <div style={{ borderTop: `1px solid ${selectedStrategy.riskLevel === "low" ? "rgba(22,163,74,0.15)" : "rgba(217,119,6,0.15)"}`, padding: "12px 20px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
        {VAULT_STRATEGIES.map((s) => (
          <div
            key={s.id}
            style={{
              display: "flex", alignItems: "center", gap: "6px",
              padding: "4px 10px", borderRadius: "100px",
              backgroundColor: s.id === selectedStrategy.id ? s.riskColor + "20" : "transparent",
              border: `1px solid ${s.id === selectedStrategy.id ? s.riskColor + "60" : "var(--color-border)"}`,
            }}
          >
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: s.riskColor, display: "inline-block" }} />
            <span style={{ fontSize: "0.75rem", fontWeight: 600, color: s.id === selectedStrategy.id ? "var(--color-ink-900)" : "var(--color-ink-400)" }}>
              {s.label} · {s.apyMin}–{s.apyMax}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
