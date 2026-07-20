import { useState } from "react";
import { useDashboardContext } from "@/hooks/DashboardContext";
import { createClient } from "@/lib/supabase/client";
import type { FamilyRecipient } from "@/types/domain";

type RawFamily = FamilyRecipient & { monthly_allowance?: number; payee_label?: string };

export default function FamilyView() {
  const { family, profile, refreshData } = useDashboardContext();
  const [activeTab, setActiveTab] = useState<"recipients" | "history">("recipients");
  const [isAdding, setIsAdding] = useState(false);

  // Handle both camelCase (domain type) and snake_case (raw DB row)
  const getMonthlyAllowance = (f: RawFamily) => f.monthlyAllowance ?? f.monthly_allowance ?? 0;
  const getPayeeLabel = (f: RawFamily) => f.payeeLabel ?? f.payee_label ?? "";

  const handleAddRecipient = async () => {
    if (!profile) return alert("Please connect or login first.");
    const name = prompt("Enter Recipient Name:");
    if (!name) return;
    const relationship = prompt("Relationship (e.g., Parent, Sibling):") || "Family";
    const amountStr = prompt("Monthly Allowance (INR):");
    const amount = Number(amountStr) || 0;

    setIsAdding(true);
    const supabase = createClient();
    try {
      await supabase.from("family_recipients").insert({
        user_id: profile.id,
        name,
        relationship,
        avatar_initials: name.charAt(0).toUpperCase(),
        payee_type: "upi",
        payee_identifier: "placeholder@upi",
        payee_label: "UPI",
        monthly_allowance: amount,
        allowance_enabled: amount > 0,
        total_transferred_inr: 0
      });
      await refreshData();
    } catch (err) {
      console.error(err);
      alert("Failed to add recipient.");
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
            Family & Remittances
          </h2>
          <p style={{ fontSize: "0.875rem", color: "var(--color-ink-500)", marginTop: "6px" }}>
            Manage monthly allowances and send money home.
          </p>
        </div>
        <button 
          className="btn btn-primary" 
          style={{ fontSize: "0.875rem", padding: "8px 16px" }}
          onClick={handleAddRecipient}
          disabled={isAdding}
        >
          {isAdding ? "Adding..." : "+ Add recipient"}
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "24px", borderBottom: "1px solid var(--color-border)" }}>
        {(["recipients", "history"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            style={{
              background: "none", border: "none",
              padding: "0 0 12px",
              fontSize: "0.875rem", fontWeight: activeTab === t ? 600 : 500,
              color: activeTab === t ? "var(--color-ink-900)" : "var(--color-ink-500)",
              borderBottom: activeTab === t ? "2px solid var(--color-ink-900)" : "2px solid transparent",
              cursor: "pointer",
              textTransform: "capitalize",
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {activeTab === "recipients" ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "16px" }}>
          {family.length === 0 ? (
            <div style={{ padding: "40px", textAlign: "center", backgroundColor: "var(--color-bg-card)", color: "var(--color-ink-500)", fontSize: "0.875rem", borderRadius: "12px", border: "1px solid var(--color-border)", gridColumn: "1 / -1" }}>
              No family recipients found.
            </div>
          ) : family.map((f: RawFamily) => (
            <div key={f.id} className="card" style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <div style={{
                  width: "48px", height: "48px", borderRadius: "50%",
                  backgroundColor: "var(--color-ink-100)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "1.25rem", fontWeight: 600, color: "var(--color-ink-700)"
                }}>
                  {f.name.charAt(0)}
                </div>
                <div>
                  <p style={{ fontWeight: 600, color: "var(--color-ink-900)" }}>{f.name}</p>
                  <p style={{ fontSize: "0.75rem", color: "var(--color-ink-500)", marginTop: "2px" }}>
                    {f.relationship} · {getPayeeLabel(f)}
                  </p>
                </div>
              </div>

              <div style={{ padding: "16px", backgroundColor: "var(--color-bg-card)", borderRadius: "8px", border: "1px solid var(--color-border)" }}>
                <p style={{ fontSize: "0.75rem", color: "var(--color-ink-500)", marginBottom: "4px" }}>Monthly Allowance</p>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                  <p style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", color: "var(--color-ink-900)" }}>
                    ₹{Number(getMonthlyAllowance(f)).toLocaleString("en-IN")}
                  </p>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                    <div style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "var(--color-jade)" }} />
                    <span style={{ fontSize: "0.6875rem", fontWeight: 600, color: "var(--color-jade)", textTransform: "uppercase" }}>Active</span>
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", gap: "8px" }}>
                <button className="btn btn-ghost" style={{ flex: 1, padding: "8px", fontSize: "0.875rem", border: "1px solid var(--color-border)" }}>Edit</button>
                <button className="btn btn-primary" style={{ flex: 1, padding: "8px", fontSize: "0.875rem", backgroundColor: "var(--color-ink-900)" }}>Send Now</button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ padding: "40px", textAlign: "center", backgroundColor: "#fff", color: "var(--color-ink-500)", fontSize: "0.875rem", borderRadius: "12px", border: "1px solid var(--color-border)" }}>
          No transfer history available yet.
        </div>
      )}
    </div>
  );
}
