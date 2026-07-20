"use client";

import { useDashboardContext } from "@/hooks/DashboardContext";
import { useState } from "react";
import { toast } from "sonner";

export default function RulesEditor() {
  const { rules, refreshData } = useDashboardContext();
  const [isEditing, setIsEditing] = useState(false);
  const [newRuleName, setNewRuleName] = useState("My Custom Rule");
  const [allocations, setAllocations] = useState<{ bucket: string; percent: number }[]>([
    { bucket: "income", percent: 50 },
    { bucket: "savings", percent: 30 },
    { bucket: "family", percent: 20 },
  ]);
  const [saving, setSaving] = useState(false);
  // Optimistic toggle state: tracks pending toggle operations
  const [toggling, setToggling] = useState<Record<string, boolean>>({});

  const toggleRule = async (ruleId: string, currentStatus: boolean) => {
    // Optimistic UI update
    setToggling(prev => ({ ...prev, [ruleId]: true }));
    try {
      const res = await fetch("/api/ai/toggle-rule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ruleId, isActive: !currentStatus }),
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error("Failed to toggle rule: " + (err.error || "Unknown error"));
      } else {
        await refreshData();
      }
    } catch (e) {
      toast.error("Error: " + (e as Error).message);
    } finally {
      setToggling(prev => ({ ...prev, [ruleId]: false }));
    }
  };

  const handleSaveRule = async () => {
    setSaving(true);
    try {
      const total = allocations.reduce((s, a) => s + (a.percent || 0), 0);
      if (total > 100) {
        toast.error(`Allocations total ${total}% — must be ≤ 100%.`);
        return;
      }

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
        toast.error("Failed to save rule: " + (err.error || "Unknown error"));
        return;
      }
      await refreshData();
      setIsEditing(false);
      // Reset form
      setNewRuleName("My Custom Rule");
      setAllocations([
        { bucket: "income", percent: 50 },
        { bucket: "savings", percent: 30 },
        { bucket: "family", percent: 20 },
      ]);
      toast.success("Rule saved successfully.");
    } catch (e) {
      toast.error("Error: " + (e as Error).message);
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

  const totalPct = allocations.reduce((s, a) => s + (a.percent || 0), 0);

  const BUCKET_OPTIONS = ["income", "bills", "family", "savings"];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <div>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "2rem", color: "var(--color-ink-900)", letterSpacing: "-0.02em" }}>
          Allocation Rules
        </h2>
        <p style={{ fontSize: "0.875rem", color: "var(--color-ink-500)", marginTop: "6px" }}>
          Set up automated routing for incoming funds. Active rules are applied immediately when a paycheck arrives.
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {rules.length === 0 ? (
          <div style={{ padding: "40px", textAlign: "center", backgroundColor: "var(--color-bg-card)", color: "var(--color-ink-500)", fontSize: "0.875rem", borderRadius: "12px", border: "1px solid var(--color-border)" }}>
            No allocation rules configured yet. Create one below or ask the AI agent.
          </div>
        ) : rules.map((r) => {
          const isBeingToggled = !!toggling[r.id];
          const displayActive = r.isActive; // use DB state; optimistic is via toggling state

          return (
            <div key={r.id} className="card" style={{ padding: "20px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px" }}>
              <div style={{ display: "flex", gap: "16px", alignItems: "center", minWidth: 0 }}>
                <div style={{
                  width: "48px", height: "48px", borderRadius: "12px", flexShrink: 0,
                  backgroundColor: displayActive ? "var(--color-jade-light)" : "var(--color-bg-card)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "1.25rem", border: "1px solid var(--color-border)"
                }}>
                  {displayActive ? "⚡" : "⏸️"}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                    <p style={{ fontWeight: 600, color: "var(--color-ink-900)" }}>{r.name}</p>
                    {r.aiGenerated && (
                      <span style={{ fontSize: "0.7rem", padding: "2px 8px", borderRadius: "100px", backgroundColor: "var(--color-jade-light)", color: "var(--color-jade)", fontWeight: 700 }}>
                        AI Generated
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: "0.8125rem", color: "var(--color-ink-500)", marginTop: "4px", fontFamily: "var(--font-mono)", wordBreak: "break-word" }}>
                    {r.incomeSourceFilter || "Any income"} {'->'} {r.allocations.map(a => `${a.percent}% ${a.bucket}`).join(', ')}
                  </p>
                </div>
              </div>

              {/* Toggle switch — uses onClick directly on the div, not hidden checkbox */}
              <div
                onClick={() => !isBeingToggled && toggleRule(r.id, r.isActive)}
                role="switch"
                aria-checked={displayActive}
                aria-label={`Toggle rule ${r.name}`}
                style={{
                  width: "44px",
                  height: "24px",
                  borderRadius: "12px",
                  backgroundColor: isBeingToggled
                    ? "var(--color-ink-300)"
                    : displayActive ? "var(--color-jade)" : "var(--color-ink-300)",
                  position: "relative",
                  cursor: isBeingToggled ? "not-allowed" : "pointer",
                  transition: "background-color 0.2s",
                  flexShrink: 0,
                  boxShadow: "inset 0 1px 3px rgba(0,0,0,0.15)"
                }}
              >
                <div style={{
                  width: "18px",
                  height: "18px",
                  borderRadius: "50%",
                  backgroundColor: "#fff",
                  position: "absolute",
                  top: "3px",
                  left: displayActive ? "23px" : "3px",
                  transition: "left 0.2s",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.2)"
                }} />
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: "8px" }}>
        {!isEditing ? (
          <button className="btn btn-primary" onClick={() => setIsEditing(true)}>
            + Create New Rule
          </button>
        ) : (
          <div className="card" style={{ padding: "28px", display: "flex", flexDirection: "column", gap: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ fontSize: "1.125rem", fontWeight: 600 }}>Create Allocation Rule</h3>
              <button className="btn btn-ghost" onClick={() => setIsEditing(false)} style={{ fontSize: "0.875rem", padding: "6px 12px" }}>
                Cancel
              </button>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.875rem", marginBottom: "8px", color: "var(--color-ink-700)", fontWeight: 500 }}>
                Rule Name
              </label>
              <input
                type="text"
                className="input"
                value={newRuleName}
                onChange={e => setNewRuleName(e.target.value)}
                style={{ width: "100%" }}
              />
            </div>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                <label style={{ fontSize: "0.875rem", color: "var(--color-ink-700)", fontWeight: 500 }}>
                  Allocations
                </label>
                <span style={{
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  color: totalPct > 100 ? "#C0392B" : totalPct === 100 ? "var(--color-jade)" : "var(--color-ink-500)"
                }}>
                  Total: {totalPct}% {totalPct !== 100 && totalPct <= 100 ? `(${100 - totalPct}% will go to income)` : totalPct > 100 ? "— exceeds 100%!" : "✓"}
                </span>
              </div>

              {allocations.map((a, idx) => (
                <div key={idx} style={{ display: "flex", gap: "8px", marginBottom: "8px", alignItems: "center" }}>
                  <select
                    value={a.bucket}
                    onChange={e => updateBucket(idx, "bucket", e.target.value)}
                    className="input"
                    style={{ flex: 1 }}
                  >
                    {BUCKET_OPTIONS.map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    className="input"
                    value={a.percent}
                    min={0}
                    max={100}
                    onChange={e => updateBucket(idx, "percent", Number(e.target.value))}
                    style={{ width: "80px" }}
                  />
                  <span style={{ fontSize: "0.875rem", color: "var(--color-ink-500)" }}>%</span>
                  <button className="btn btn-ghost" onClick={() => removeBucket(idx)} style={{ fontSize: "0.875rem", padding: "8px 12px" }}>✕</button>
                </div>
              ))}
              <button className="btn btn-ghost" style={{ fontSize: "0.8125rem" }} onClick={addBucket}>
                + Add Bucket
              </button>
            </div>

            <div style={{ display: "flex", gap: "12px", marginTop: "4px" }}>
              <button
                className="btn btn-primary"
                onClick={handleSaveRule}
                disabled={saving || totalPct > 100}
              >
                {saving ? "Saving..." : "Save & Activate Rule"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
