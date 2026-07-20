"use client";

import { useDashboardContext } from "@/hooks/DashboardContext";
import { useState } from "react";

export default function RulesEditor() {
  const { rules, refreshData } = useDashboardContext();
  const [isEditing, setIsEditing] = useState(false);
  const [newRuleName, setNewRuleName] = useState("My Custom Rule");
  const [allocations, setAllocations] = useState<{ bucket: string; percent: number }[]>([
    { bucket: "income", percent: 50 },
    { bucket: "savings", percent: 30 },
    { bucket: "remittance", percent: 20 },
  ]);
  const [saving, setSaving] = useState(false);

  const toggleRule = async (ruleId: string, currentStatus: boolean) => {
    try {
      const res = await fetch("/api/ai/toggle-rule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ruleId, isActive: !currentStatus }),
      });
      if (!res.ok) {
        const err = await res.json();
        alert("Failed to toggle rule: " + (err.error || "Unknown error"));
      } else {
        await refreshData();
      }
    } catch (e) {
      alert("Error: " + (e as Error).message);
    }
  };

  const handleSaveRule = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/ai/apply-rule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newRuleName,
          allocations,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        alert("Failed to save rule: " + (err.error || "Unknown error"));
        return;
      }
      await refreshData();
      setIsEditing(false);
    } catch (e) {
      alert("Error: " + (e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const addBucket = () => setAllocations([...allocations, { bucket: "income", percent: 0 }]);
  const updateBucket = (idx: number, key: "bucket" | "percent", val: string | number) => {
    const newAlloc = [...allocations];
    newAlloc[idx] = { ...newAlloc[idx], [key]: val };
    setAllocations(newAlloc);
  };
  const removeBucket = (idx: number) => setAllocations(allocations.filter((_, i) => i !== idx));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <div>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "2rem", color: "var(--color-ink-900)", letterSpacing: "-0.02em" }}>
          Allocation Rules
        </h2>
        <p style={{ fontSize: "0.875rem", color: "var(--color-ink-500)", marginTop: "6px" }}>
          Set up automated routing for incoming funds. Active rules are applied immediately via smart contracts.
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {rules.length === 0 ? (
          <div style={{ padding: "40px", textAlign: "center", backgroundColor: "var(--color-bg-card)", color: "var(--color-ink-500)", fontSize: "0.875rem", borderRadius: "12px", border: "1px solid var(--color-border)" }}>
            No allocation rules configured yet.
          </div>
        ) : rules.map((r) => (
          <div key={r.id} className="card" style={{ padding: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
              <div style={{
                width: "48px", height: "48px", borderRadius: "12px",
                backgroundColor: r.isActive ? "var(--color-jade-light)" : "var(--color-bg-card)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "1.25rem", border: "1px solid var(--color-border)"
              }}>
                {r.isActive ? "⚡" : "⏸️"}
              </div>
              <div>
                <p style={{ fontWeight: 600, color: "var(--color-ink-900)" }}>{r.name}</p>
                <p style={{ fontSize: "0.875rem", color: "var(--color-ink-500)", marginTop: "4px", fontFamily: "var(--font-mono)" }}>
                  {r.incomeSourceFilter || "Any income"} {'->'} {r.allocations.map(a => `${a.percent}% ${a.bucket}`).join(', ')}
                </p>
              </div>
            </div>
            
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                <input 
                  type="checkbox" 
                  checked={r.isActive} 
                  onChange={() => toggleRule(r.id, r.isActive)}
                  style={{ display: "none" }} 
                />
                <div style={{
                  width: "36px", height: "20px", borderRadius: "10px",
                  backgroundColor: r.isActive ? "var(--color-jade)" : "var(--color-ink-300)",
                  position: "relative",
                  transition: "background-color 0.2s"
                }}>
                  <div style={{
                    width: "16px", height: "16px", borderRadius: "50%", backgroundColor: "#fff",
                    position: "absolute", top: "2px", left: r.isActive ? "18px" : "2px",
                    transition: "left 0.2s"
                  }} />
                </div>
              </label>
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: "16px" }}>
        {!isEditing ? (
          <button className="btn btn-primary" onClick={() => setIsEditing(true)}>
            + Create New Rule
          </button>
        ) : (
          <div className="card" style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
            <h3 style={{ fontSize: "1.125rem", fontWeight: 600 }}>Create Rule</h3>
            
            <div>
              <label style={{ display: "block", fontSize: "0.875rem", marginBottom: "8px", color: "var(--color-ink-700)" }}>Rule Name</label>
              <input 
                type="text" 
                className="input" 
                value={newRuleName} 
                onChange={e => setNewRuleName(e.target.value)} 
                style={{ width: "100%" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.875rem", marginBottom: "8px", color: "var(--color-ink-700)" }}>Allocations (%)</label>
              {allocations.map((a, idx) => (
                <div key={idx} style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
                  <input 
                    type="text" 
                    className="input" 
                    value={a.bucket} 
                    onChange={e => updateBucket(idx, "bucket", e.target.value)}
                    style={{ flex: 1 }}
                  />
                  <input 
                    type="number" 
                    className="input" 
                    value={a.percent} 
                    onChange={e => updateBucket(idx, "percent", Number(e.target.value))}
                    style={{ width: "80px" }}
                  />
                  <button className="btn btn-ghost" onClick={() => removeBucket(idx)}>✕</button>
                </div>
              ))}
              <button className="btn btn-ghost" style={{ fontSize: "0.875rem" }} onClick={addBucket}>+ Add Bucket</button>
            </div>

            <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
              <button className="btn btn-primary" onClick={handleSaveRule} disabled={saving}>
                {saving ? "Saving..." : "Save Active Rule"}
              </button>
              <button className="btn btn-ghost" onClick={() => setIsEditing(false)}>Cancel</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
