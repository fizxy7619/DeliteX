import { useState } from "react";
import { useDashboardContext } from "@/hooks/DashboardContext";
import { createClient } from "@/lib/supabase/client";
import type { Bill } from "@/types/domain";

type RawBill = Bill & { next_due_date?: string; is_autopay_enabled?: boolean };

export default function BillsView() {
  const { bills, profile, refreshData } = useDashboardContext();
  const [filter, setFilter] = useState<"all" | "upcoming" | "paid">("all");
  const [isAdding, setIsAdding] = useState(false);

  const today = new Date("2026-07-16").toISOString().split("T")[0]; // Mocking today for demo logic

  // Handle both camelCase (domain type) and snake_case (raw DB row)
  const getNextDueDate = (b: RawBill) => b.nextDueDate || b.next_due_date || "";
  const getIsAutopay = (b: RawBill) => b.isAutopayEnabled ?? b.is_autopay_enabled ?? false;

  const filteredBills = bills.filter((b: RawBill) => {
    const due = getNextDueDate(b);
    if (filter === "all") return true;
    if (filter === "upcoming") return due >= today;
    return due < today;
  });

  const totalUpcoming = bills
    .filter((b: RawBill) => getNextDueDate(b) >= today)
    .reduce((sum: number, b: RawBill) => sum + (Number(b.amount) || 0), 0);

  const handleAddBill = async () => {
    if (!profile) return alert("Please connect or login first.");
    const name = prompt("Enter Bill Name (e.g., Rent, Netflix):");
    if (!name) return;
    const amountStr = prompt("Enter Amount (INR):");
    if (!amountStr || isNaN(Number(amountStr))) return;
    
    // Set due date 7 days from now
    const d = new Date();
    d.setDate(d.getDate() + 7);
    const nextDueDate = d.toISOString().split("T")[0];

    setIsAdding(true);
    const supabase = createClient();
    try {
      await supabase.from("bills").insert({
        user_id: profile.id,
        name,
        amount: Number(amountStr),
        currency: "INR",
        frequency: "monthly",
        next_due_date: nextDueDate,
        is_autopay_enabled: true
      });
      await refreshData();
    } catch (err) {
      console.error(err);
      alert("Failed to add bill.");
    } finally {
      setIsAdding(false);
    }
  };

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
        <button 
          className="btn btn-primary" 
          style={{ fontSize: "0.875rem", padding: "8px 16px" }}
          onClick={handleAddBill}
          disabled={isAdding}
        >
          {isAdding ? "Adding..." : "+ Add bill"}
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
                  Due {new Date(getNextDueDate(bill)).toLocaleDateString("en-IN", { month: "short", day: "numeric" })} · {bill.frequency}
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
                    backgroundColor: getIsAutopay(bill) ? "var(--color-jade)" : "var(--color-ink-300)"
                  }} />
                  <span style={{ fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", color: "var(--color-ink-500)" }}>
                    Autopay {getIsAutopay(bill) ? "ON" : "OFF"}
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
