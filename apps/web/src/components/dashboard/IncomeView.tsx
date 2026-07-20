import type { PaymentEvent } from "@/types/domain";
import { MOCK_PAYMENT_EVENTS } from "@/lib/mock-data";

function statusBadge(status: PaymentEvent["status"]) {
  const map = {
    completed: { color: "var(--color-jade)", bg: "var(--color-jade-light)", label: "Settled" },
    pending:   { color: "var(--color-saffron)", bg: "var(--color-saffron-light)", label: "Pending" },
    processing:{ color: "#4F46E5", bg: "#EEF2FF", label: "Processing" },
    failed:    { color: "#C0392B", bg: "#FEF2F2", label: "Failed" },
  };
  const s = map[status];
  return (
    <span style={{ fontSize: "0.6875rem", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", color: s.color, backgroundColor: s.bg, borderRadius: "100px", padding: "3px 9px" }}>
      {s.label}
    </span>
  );
}

export default function IncomeView() {
  const incoming = MOCK_PAYMENT_EVENTS.filter((e) => e.direction === "incoming");
  const totalUsdcIn = incoming.filter((e) => e.status === "completed").reduce((s, e) => s + e.amount, 0);

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
        <div className="card" style={{ padding: "16px 24px", flexShrink: 0 }}>
          <p style={{ fontSize: "0.75rem", color: "var(--color-ink-500)", marginBottom: "4px" }}>Total settled (July)</p>
          <p style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", color: "var(--color-jade)" }}>
            ${totalUsdcIn.toLocaleString("en-US")} USDC
          </p>
        </div>
      </div>

      {/* Stellary note */}
      <div style={{
        display: "flex", alignItems: "flex-start", gap: "12px", padding: "14px 16px",
        backgroundColor: "var(--color-jade-light)", borderRadius: "10px", border: "1px solid rgba(43,122,90,0.2)"
      }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-jade)" strokeWidth="2" style={{ flexShrink: 0, marginTop: "1px" }}>
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <p style={{ fontSize: "0.8125rem", color: "var(--color-jade)", lineHeight: 1.6 }}>
          <strong>Phase 3:</strong> Payments will settle directly via Stellar in 3–5 seconds. Current transactions are mocked for UI development.
        </p>
      </div>

      {/* Table */}
      <div style={{ border: "1px solid var(--color-border)", borderRadius: "12px", overflow: "hidden" }}>
        {/* Head */}
        <div style={{
          display: "grid", gridTemplateColumns: "1fr auto auto auto",
          padding: "10px 20px", backgroundColor: "var(--color-bg)",
          borderBottom: "1px solid var(--color-border)",
          fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", color: "var(--color-ink-500)",
          gap: "16px"
        }}>
          <span>Description</span>
          <span style={{ textAlign: "right" }}>Amount</span>
          <span style={{ textAlign: "right" }}>FX Rate</span>
          <span style={{ textAlign: "right" }}>Status</span>
        </div>
        {incoming.map((evt, i) => (
          <div
            key={evt.id}
            style={{
              display: "grid", gridTemplateColumns: "1fr auto auto auto",
              padding: "16px 20px", gap: "16px", alignItems: "center",
              backgroundColor: "#fff",
              borderBottom: i < incoming.length - 1 ? "1px solid var(--color-border)" : "none",
            }}
          >
            <div>
              <p style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--color-ink-900)" }}>{evt.description}</p>
              <p style={{ fontSize: "0.75rem", color: "var(--color-ink-500)", marginTop: "3px" }}>
                {evt.counterparty} · {new Date(evt.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
              </p>
            </div>
            <div style={{ textAlign: "right" }}>
              <p style={{ fontSize: "0.9375rem", fontWeight: 600, color: "var(--color-jade)" }}>+{evt.amount} {evt.currency}</p>
              {evt.inrEquivalent && (
                <p style={{ fontSize: "0.75rem", color: "var(--color-ink-500)" }}>≈ ₹{evt.inrEquivalent.toLocaleString("en-IN")}</p>
              )}
            </div>
            <div style={{ textAlign: "right" }}>
              {evt.fxRate ? (
                <p style={{ fontSize: "0.8125rem", color: "var(--color-ink-700)" }}>₹{evt.fxRate}</p>
              ) : (
                <p style={{ fontSize: "0.8125rem", color: "var(--color-ink-300)" }}>—</p>
              )}
            </div>
            <div style={{ textAlign: "right" }}>{statusBadge(evt.status)}</div>
          </div>
        ))}
      </div>

      {/* Empty state for when real data hooks in */}
      <p style={{ fontSize: "0.8125rem", color: "var(--color-ink-300)", textAlign: "center", paddingBottom: "8px" }}>
        Showing mock data · Real payments via Stellar in Phase 3
      </p>
    </div>
  );
}
