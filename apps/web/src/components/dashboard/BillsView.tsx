/* eslint-disable react-hooks/purity */
"use client";

import { useState } from "react";
import type { Bill } from "@/types/domain";
import { MOCK_BILLS } from "@/lib/mock-data";

function frequencyLabel(f: Bill["frequency"]) {
  return { monthly: "Monthly", weekly: "Weekly", quarterly: "Quarterly", yearly: "Yearly", one_time: "One-time" }[f];
}

export default function BillsView() {
  const [bills, setBills] = useState<Bill[]>(MOCK_BILLS);

  function toggleAutopay(id: string) {
    setBills((prev) =>
      prev.map((b) => b.id === id ? { ...b, isAutopayEnabled: !b.isAutopayEnabled } : b)
    );
  }

  const totalMonthly = bills.filter(b => b.frequency === "monthly" && !b.isPaused)
    .reduce((s, b) => s + b.amount, 0);

  const dueSoon = bills.filter(b => {
    const due = new Date(b.nextDueDate);
    const now = new Date();
    const diff = (due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return diff <= 7 && diff >= 0;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <p className="text-label" style={{ marginBottom: "8px" }}>Bills</p>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "2rem", color: "var(--color-ink-900)", letterSpacing: "-0.02em" }}>
            Recurring obligations
          </h2>
        </div>
        <button className="btn btn-primary" style={{ padding: "10px 20px", fontSize: "0.875rem" }}>
          + Add bill
        </button>
      </div>

      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "16px" }}>
        {[
          { label: "Monthly total", value: `₹${totalMonthly.toLocaleString("en-IN")}`, sub: `${bills.length} bills` },
          { label: "Autopay enabled", value: `${bills.filter(b => b.isAutopayEnabled).length}`, sub: `of ${bills.length} bills` },
          { label: "Due in 7 days", value: `${dueSoon.length}`, sub: dueSoon.length > 0 ? dueSoon.map(b => b.name).join(", ") : "None" },
        ].map((s) => (
          <div key={s.label} className="card">
            <p style={{ fontSize: "0.75rem", color: "var(--color-ink-500)", marginBottom: "6px" }}>{s.label}</p>
            <p style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", color: "var(--color-ink-900)", marginBottom: "2px" }}>{s.value}</p>
            <p style={{ fontSize: "0.75rem", color: "var(--color-ink-300)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Bills list */}
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {bills.map((bill) => {
          const due = new Date(bill.nextDueDate);
          const diff = Math.ceil((due.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
          const urgent = diff <= 3 && diff >= 0;

          return (
            <div
              key={bill.id}
              className="card"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "16px",
                flexWrap: "wrap",
                opacity: bill.isPaused ? 0.55 : 1,
              }}
            >
              {/* Icon */}
              <div style={{
                width: "42px", height: "42px", borderRadius: "10px", flexShrink: 0,
                backgroundColor: "var(--color-saffron-light)",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "var(--color-saffron)",
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                  <rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>
                </svg>
              </div>

              {/* Info */}
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                  <p style={{ fontWeight: 600, fontSize: "0.9375rem", color: "var(--color-ink-900)" }}>{bill.name}</p>
                  <span style={{ fontSize: "0.75rem", color: "var(--color-ink-500)" }}>{frequencyLabel(bill.frequency)}</span>
                  {bill.isPaused && <span style={{ fontSize: "0.6875rem", fontWeight: 700, color: "var(--color-ink-300)", backgroundColor: "var(--color-bg)", border: "1px solid var(--color-border)", borderRadius: "100px", padding: "2px 8px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Paused</span>}
                </div>
                <p style={{ fontSize: "0.8125rem", color: "var(--color-ink-500)", marginTop: "3px" }}>
                  {bill.payee} ·{" "}
                  <span style={{ color: urgent ? "var(--color-saffron)" : "inherit" }}>
                    Due {due.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    {urgent ? " ⚡" : ""}
                  </span>
                </p>
              </div>

              {/* Amount */}
              <p style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", color: "var(--color-ink-900)", flexShrink: 0 }}>
                ₹{bill.amount.toLocaleString("en-IN")}
              </p>

              {/* Autopay toggle */}
              <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
                <span style={{ fontSize: "0.75rem", color: "var(--color-ink-500)" }}>Autopay</span>
                <button
                  onClick={() => toggleAutopay(bill.id)}
                  role="switch"
                  aria-checked={bill.isAutopayEnabled}
                  style={{
                    width: "40px", height: "22px", borderRadius: "100px", border: "none", cursor: "pointer",
                    backgroundColor: bill.isAutopayEnabled ? "var(--color-jade)" : "var(--color-border)",
                    position: "relative", transition: "background 0.2s",
                    padding: 0,
                  }}
                >
                  <span style={{
                    position: "absolute", top: "3px",
                    left: bill.isAutopayEnabled ? "21px" : "3px",
                    width: "16px", height: "16px", borderRadius: "50%",
                    backgroundColor: "#fff", transition: "left 0.2s",
                  }} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
