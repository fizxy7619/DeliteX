import { useState } from "react";
import { useDashboardContext } from "@/hooks/DashboardContext";

export default function BillsView() {
  const { bills } = useDashboardContext();
  const [filter, setFilter] = useState<"all" | "upcoming" | "paid">("all");

  const today = new Date("2026-07-16").toISOString().split("T")[0]; // Mocking today for demo logic

  const filteredBills = bills.filter((b) => {
    if (filter === "all") return true;
    if (filter === "upcoming") return b.nextDueDate >= today;
    return b.nextDueDate < today;
  });

  const totalUpcoming = bills
    .filter((b) => b.nextDueDate >= today)
    .reduce((sum, b) => sum + (Number(b.amount) || 0), 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "2rem", color: "var(--color-ink-900)", letterSpacing: "-0.02em" }}>
            Bills & Autopay
          </h2>
          <p style={{ fontSize: "0.875rem", color: "var(--color-ink-500)", marginTop: "6px" }}>
            Total upcoming this month: <strong style={{ color: "var(--color-ink-900)" }}>₹{totalUpcoming.toLocaleString("en-IN")}</strong>
          </p>
        </div>
        <button className="btn btn-primary" style={{ fontSize: "0.875rem", padding: "8px 16px" }}>
          + Add bill
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "24px", borderBottom: "1px solid var(--color-border)" }}>
        {(["all", "upcoming", "paid"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            style={{
              background: "none", border: "none",
              padding: "0 0 12px",
              fontSize: "0.875rem", fontWeight: filter === t ? 600 : 500,
              color: filter === t ? "var(--color-ink-900)" : "var(--color-ink-500)",
              borderBottom: filter === t ? "2px solid var(--color-ink-900)" : "2px solid transparent",
              cursor: "pointer",
              textTransform: "capitalize",
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Bills List */}
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {filteredBills.length === 0 ? (
          <div style={{ padding: "40px", textAlign: "center", backgroundColor: "#fff", color: "var(--color-ink-500)", fontSize: "0.875rem", borderRadius: "12px", border: "1px solid var(--color-border)" }}>
            No bills found.
          </div>
        ) : filteredBills.map((bill) => (
          <div
            key={bill.id}
            className="card"
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "20px",
              flexWrap: "wrap",
              gap: "16px",
            }}
          >
            <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
              <div style={{
                width: "48px", height: "48px", borderRadius: "12px",
                backgroundColor: "var(--color-bg-card)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "1.25rem", border: "1px solid var(--color-border)"
              }}>
                📄
              </div>
              <div>
                <p style={{ fontWeight: 600, color: "var(--color-ink-900)" }}>{bill.name}</p>
                <p style={{ fontSize: "0.75rem", color: "var(--color-ink-500)", marginTop: "4px" }}>
                  Due {new Date(bill.nextDueDate).toLocaleDateString("en-IN", { month: "short", day: "numeric" })} · {bill.frequency}
                </p>
              </div>
            </div>
            
            <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
              <div style={{ textAlign: "right" }}>
                <p style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", color: "var(--color-ink-900)" }}>
                  ₹{Number(bill.amount).toLocaleString("en-IN")}
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", justifyContent: "flex-end", marginTop: "4px" }}>
                  <div style={{
                    width: "8px", height: "8px", borderRadius: "50%",
                    backgroundColor: bill.isAutopayEnabled ? "var(--color-jade)" : "var(--color-ink-300)"
                  }} />
                  <span style={{ fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", color: "var(--color-ink-500)" }}>
                    Autopay {bill.isAutopayEnabled ? "ON" : "OFF"}
                  </span>
                </div>
              </div>
              <button className="btn btn-ghost" style={{ padding: "8px", fontSize: "0.875rem" }}>
                Edit
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
