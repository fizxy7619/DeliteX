import { useState } from "react";
import type { PaymentEvent } from "@/types/domain";
import { useDashboardContext } from "@/hooks/DashboardContext";

function statusBadge(status: PaymentEvent["status"]) {
  const map = {
    completed: { color: "var(--color-jade)", bg: "rgba(43, 122, 90, 0.2)", label: "Settled" },
    pending:   { color: "var(--color-saffron)", bg: "rgba(234, 179, 8, 0.2)", label: "Pending" },
    processing:{ color: "#818cf8", bg: "rgba(99, 102, 241, 0.2)", label: "Processing" },
    failed:    { color: "#f87171", bg: "rgba(239, 68, 68, 0.2)", label: "Failed" },
  };
  const s = map[status] || map.pending;
  return (
    <span style={{ fontSize: "0.6875rem", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", color: s.color, backgroundColor: s.bg, borderRadius: "100px", padding: "3px 9px" }}>
      {s.label}
    </span>
  );
}

type RawPaymentEvent = PaymentEvent & { inr_equivalent?: number; fx_rate?: number; created_at?: string };

export default function IncomeView() {
  const { paymentEvents, profile, refreshData } = useDashboardContext();

  const getAmount = (e: RawPaymentEvent) => e.amount ?? 0;
  const getDirection = (e: RawPaymentEvent) => e.direction ?? "";
  const getInrEquivalent = (e: RawPaymentEvent) => e.inrEquivalent ?? e.inr_equivalent ?? 0;
  const getFxRate = (e: RawPaymentEvent) => e.fxRate ?? e.fx_rate ?? 0;
  const getCreatedAt = (e: RawPaymentEvent) => e.createdAt ?? e.created_at ?? new Date().toISOString();

  const incoming = paymentEvents.filter((e: RawPaymentEvent) => getDirection(e) === "incoming");
  const totalUsdcIn = incoming.filter((e: RawPaymentEvent) => e.status === "completed").reduce((s: number, e: RawPaymentEvent) => s + getAmount(e), 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <p className="text-label" style={{ marginBottom: "8px" }}>Income</p>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "2rem", color: "var(--color-ink-900)", letterSpacing: "-0.02em" }}>
            Incoming payments
          </h2>
        </div>
        <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
          <div className="card" style={{ padding: "16px 24px", flexShrink: 0 }}>
            <p style={{ fontSize: "0.75rem", color: "var(--color-ink-500)", marginBottom: "4px" }}>Total settled (July)</p>
            <p style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", color: "var(--color-jade)" }}>
              ${totalUsdcIn.toLocaleString("en-US")} USDC
            </p>
          </div>
        </div>
      </div>

      {/* Table */}
      <div style={{ border: "1px solid var(--color-border)", borderRadius: "12px", overflow: "hidden" }}>
        {/* Head */}
        <div style={{
          display: "grid", gridTemplateColumns: "1fr auto auto auto",
          padding: "10px 20px", backgroundColor: "var(--color-bg-card)",
          borderBottom: "1px solid var(--color-border)",
          fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", color: "var(--color-ink-500)",
          gap: "16px"
        }}>
          <span>Description</span>
          <span style={{ textAlign: "right" }}>Amount</span>
          <span style={{ textAlign: "right" }}>FX Rate</span>
          <span style={{ textAlign: "right" }}>Status</span>
        </div>
        {incoming.length === 0 ? (
          <div style={{ padding: "40px", textAlign: "center", backgroundColor: "var(--color-bg)", color: "var(--color-ink-500)", fontSize: "0.875rem" }}>
            No incoming payments found yet.
          </div>
        ) : incoming.map((evt: RawPaymentEvent, i: number) => (
          <div
            key={evt.id}
            style={{
              display: "grid", gridTemplateColumns: "1fr auto auto auto",
              padding: "16px 20px", gap: "16px", alignItems: "center",
              backgroundColor: "var(--color-bg)",
              borderBottom: i < incoming.length - 1 ? "1px solid var(--color-border)" : "none",
            }}
          >
            <div>
              <p style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--color-ink-900)" }}>{evt.description}</p>
              <p style={{ fontSize: "0.75rem", color: "var(--color-ink-500)", marginTop: "3px" }}>
                {evt.counterparty} · {new Date(getCreatedAt(evt)).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
              </p>
            </div>
            <div style={{ textAlign: "right" }}>
              <p style={{ fontSize: "0.9375rem", fontWeight: 600, color: "var(--color-jade)" }}>+{getAmount(evt)} {evt.currency}</p>
              {getInrEquivalent(evt) > 0 && (
                <p style={{ fontSize: "0.75rem", color: "var(--color-ink-500)" }}>≈ ₹{getInrEquivalent(evt).toLocaleString("en-IN")}</p>
              )}
            </div>
            <div style={{ textAlign: "right" }}>
              {getFxRate(evt) ? (
                <p style={{ fontSize: "0.8125rem", color: "var(--color-ink-700)" }}>₹{getFxRate(evt)}</p>
              ) : (
                <p style={{ fontSize: "0.8125rem", color: "var(--color-ink-300)" }}>—</p>
              )}
            </div>
            <div style={{ textAlign: "right" }}>{statusBadge(evt.status)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
