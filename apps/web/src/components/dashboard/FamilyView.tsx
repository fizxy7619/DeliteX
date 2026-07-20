"use client";

import { useState } from "react";
import type { FamilyRecipient } from "@/types/domain";
import { MOCK_FAMILY } from "@/lib/mock-data";

export default function FamilyView() {
  const [family, setFamily] = useState<FamilyRecipient[]>(MOCK_FAMILY);

  function toggleAllowance(id: string) {
    setFamily((prev) =>
      prev.map((f) => f.id === id ? { ...f, allowanceEnabled: !f.allowanceEnabled } : f)
    );
  }

  const totalMonthly = family
    .filter((f) => f.allowanceEnabled && f.monthlyAllowance)
    .reduce((s, f) => s + (f.monthlyAllowance ?? 0), 0);

  const totalEver = family.reduce((s, f) => s + f.totalTransferredInr, 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <p className="text-label" style={{ marginBottom: "8px" }}>Family</p>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "2rem", color: "var(--color-ink-900)", letterSpacing: "-0.02em" }}>
            Remittance recipients
          </h2>
        </div>
        <button className="btn btn-primary" style={{ padding: "10px 20px", fontSize: "0.875rem" }}>
          + Add recipient
        </button>
      </div>

      {/* Summary */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
        <div className="card">
          <p style={{ fontSize: "0.75rem", color: "var(--color-ink-500)", marginBottom: "6px" }}>Monthly allowances</p>
          <p style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", color: "var(--color-ink-900)" }}>
            ₹{totalMonthly.toLocaleString("en-IN")}
          </p>
          <p style={{ fontSize: "0.75rem", color: "var(--color-ink-300)", marginTop: "2px" }}>auto-transferred on 1st</p>
        </div>
        <div className="card">
          <p style={{ fontSize: "0.75rem", color: "var(--color-ink-500)", marginBottom: "6px" }}>Total transferred (all time)</p>
          <p style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", color: "var(--color-ink-900)" }}>
            ₹{totalEver.toLocaleString("en-IN")}
          </p>
          <p style={{ fontSize: "0.75rem", color: "var(--color-ink-300)", marginTop: "2px" }}>{family.length} recipients</p>
        </div>
      </div>

      {/* Recipient cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {family.map((recipient) => (
          <div key={recipient.id} className="card" style={{ display: "flex", gap: "16px", flexWrap: "wrap", alignItems: "center" }}>
            {/* Avatar */}
            <div style={{
              width: "48px", height: "48px", borderRadius: "50%", flexShrink: 0,
              backgroundColor: "#EEF2FF",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: "var(--font-display)", fontSize: "1.125rem", color: "#4F46E5",
            }}>
              {recipient.avatarInitials}
            </div>

            {/* Info */}
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <p style={{ fontWeight: 600, fontSize: "0.9375rem", color: "var(--color-ink-900)" }}>{recipient.name}</p>
                <span style={{ fontSize: "0.75rem", color: "var(--color-ink-500)", backgroundColor: "var(--color-bg)", border: "1px solid var(--color-border)", borderRadius: "100px", padding: "2px 8px" }}>
                  {recipient.relationship}
                </span>
              </div>
              <p style={{ fontSize: "0.8125rem", color: "var(--color-ink-500)", marginTop: "4px" }}>
                {recipient.payeeIdentifier} via {recipient.payeeLabel}
              </p>
              {recipient.lastTransferAt && (
                <p style={{ fontSize: "0.75rem", color: "var(--color-ink-300)", marginTop: "2px" }}>
                  Last: ₹{recipient.lastTransferAmount?.toLocaleString("en-IN")} on{" "}
                  {new Date(recipient.lastTransferAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                </p>
              )}
            </div>

            {/* Allowance */}
            <div style={{ flexShrink: 0, textAlign: "right" }}>
              {recipient.monthlyAllowance ? (
                <>
                  <p style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", color: "var(--color-ink-900)" }}>
                    ₹{recipient.monthlyAllowance.toLocaleString("en-IN")}
                    <span style={{ fontSize: "0.75rem", fontFamily: "var(--font-body)", color: "var(--color-ink-500)" }}>/mo</span>
                  </p>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", justifyContent: "flex-end", marginTop: "6px" }}>
                    <span style={{ fontSize: "0.75rem", color: "var(--color-ink-500)" }}>Auto</span>
                    <button
                      onClick={() => toggleAllowance(recipient.id)}
                      role="switch"
                      aria-checked={recipient.allowanceEnabled}
                      style={{
                        width: "36px", height: "20px", borderRadius: "100px", border: "none", cursor: "pointer",
                        backgroundColor: recipient.allowanceEnabled ? "var(--color-jade)" : "var(--color-border)",
                        position: "relative", transition: "background 0.2s", padding: 0,
                      }}
                    >
                      <span style={{
                        position: "absolute", top: "2px",
                        left: recipient.allowanceEnabled ? "18px" : "2px",
                        width: "16px", height: "16px", borderRadius: "50%",
                        backgroundColor: "#fff", transition: "left 0.2s",
                      }} />
                    </button>
                  </div>
                </>
              ) : (
                <button className="btn btn-ghost" style={{ padding: "8px 14px", fontSize: "0.8125rem" }}>
                  Send money
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
