import type { Bucket } from "@/types/domain";
import { MOCK_BUCKETS } from "@/lib/mock-data";

function fmt(n: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}

function BucketCard({ bucket }: { bucket: Bucket }) {
  const colors: Record<string, { bg: string; fg: string }> = {
    income: { bg: "var(--color-jade-light)", fg: "var(--color-jade)" },
    bills: { bg: "var(--color-saffron-light)", fg: "var(--color-saffron)" },
    family: { bg: "#EEF2FF", fg: "#4F46E5" },
    savings: { bg: "#F0FDF4", fg: "#16A34A" },
  };
  const c = colors[bucket.type];

  return (
    <div
      className="card"
      style={{ display: "flex", flexDirection: "column", gap: "16px" }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "0.8125rem",
            fontWeight: 600,
            color: c.fg,
            backgroundColor: c.bg,
            borderRadius: "100px",
            padding: "4px 10px",
          }}
        >
          {bucket.label}
        </span>
        <span style={{ fontSize: "0.75rem", color: "var(--color-ink-300)" }}>
          {bucket.nativeCurrency}
        </span>
      </div>
      <div>
        <p style={{ fontFamily: "var(--font-display)", fontSize: "1.75rem", color: "var(--color-ink-900)", lineHeight: 1.15 }}>
          {fmt(bucket.balanceInr)}
        </p>
        <p style={{ fontSize: "0.8125rem", color: "var(--color-ink-500)", marginTop: "4px" }}>
          {bucket.balanceNative.toLocaleString("en-US")} {bucket.nativeCurrency} · {bucket.description}
        </p>
      </div>
    </div>
  );
}

export default function OverviewView() {
  const totalInr = MOCK_BUCKETS.reduce((s, b) => s + b.balanceInr, 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
      {/* Total balance hero */}
      <div>
        <p className="text-label" style={{ marginBottom: "8px" }}>Total portfolio value</p>
        <p style={{ fontFamily: "var(--font-display)", fontSize: "3rem", color: "var(--color-ink-900)", letterSpacing: "-0.02em", lineHeight: 1 }}>
          {fmt(totalInr)}
        </p>
        <p style={{ fontSize: "0.875rem", color: "var(--color-ink-500)", marginTop: "8px" }}>
          Across 4 buckets · Updated just now
        </p>
      </div>

      {/* Bucket cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
        {MOCK_BUCKETS.map((b) => <BucketCard key={b.type} bucket={b} />)}
      </div>

      {/* Quick stats bar */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          gap: "1px",
          border: "1px solid var(--color-border)",
          borderRadius: "12px",
          overflow: "hidden",
          backgroundColor: "var(--color-border)",
        }}
      >
        {[
          { label: "This month income", value: "₹1,72,405" },
          { label: "Bills due this month", value: "₹43,049" },
          { label: "Family transferred", value: "₹15,000" },
          { label: "Yield earned (USDC)", value: "+$58.40" },
        ].map((s) => (
          <div key={s.label} style={{ backgroundColor: "#fff", padding: "20px" }}>
            <p style={{ fontSize: "0.75rem", color: "var(--color-ink-500)", marginBottom: "6px" }}>{s.label}</p>
            <p style={{ fontFamily: "var(--font-display)", fontSize: "1.375rem", color: "var(--color-ink-900)" }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Recent activity */}
      <div>
        <p style={{ fontWeight: 600, fontSize: "0.9375rem", color: "var(--color-ink-900)", marginBottom: "16px" }}>Recent activity</p>
        <div style={{ display: "flex", flexDirection: "column", gap: "0", border: "1px solid var(--color-border)", borderRadius: "12px", overflow: "hidden" }}>
          {[
            { label: "Invoice #INV-2026-041 — GlobalOps Ltd.", amount: "+$2,000", status: "pending", time: "Today" },
            { label: "Invoice #INV-2024-038 — Acme Corp", amount: "+$1,200", status: "completed", time: "Jul 14" },
            { label: "Rent — July 2026", amount: "−₹18,000", status: "completed", time: "Jul 1" },
            { label: "Monthly allowance — Dad", amount: "−₹10,000", status: "completed", time: "Jul 1" },
          ].map((row, i) => (
            <div
              key={row.label}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "14px 20px",
                borderBottom: i < 3 ? "1px solid var(--color-border)" : "none",
                backgroundColor: "#fff",
              }}
            >
              <div>
                <p style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--color-ink-900)" }}>{row.label}</p>
                <p style={{ fontSize: "0.75rem", color: "var(--color-ink-500)", marginTop: "2px" }}>{row.time}</p>
              </div>
              <div style={{ textAlign: "right" }}>
                <p style={{ fontSize: "0.875rem", fontWeight: 600, color: row.amount.startsWith("+") ? "var(--color-jade)" : "var(--color-ink-700)" }}>
                  {row.amount}
                </p>
                <span style={{
                  fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase",
                  color: row.status === "pending" ? "var(--color-saffron)" : "var(--color-jade)",
                }}>
                  {row.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
