"use client";

import { useState, useCallback } from "react";
import type { AllocationSlice, BucketType } from "@/types/domain";
import { MOCK_RULES } from "@/lib/mock-data";

const BUCKET_CONFIG: Record<BucketType, { label: string; color: string; bg: string }> = {
  income:  { label: "Keep as cash",  color: "var(--color-jade)",    bg: "var(--color-jade-light)" },
  bills:   { label: "Bills",         color: "var(--color-saffron)", bg: "var(--color-saffron-light)" },
  family:  { label: "Family",        color: "#4F46E5",              bg: "#EEF2FF" },
  savings: { label: "Vault savings", color: "#16A34A",              bg: "#F0FDF4" },
};

const ORDER: BucketType[] = ["bills", "family", "savings", "income"];

export default function RulesEditor() {
  const initialSlices = MOCK_RULES[0].allocations;
  const [slices, setSlices] = useState<AllocationSlice[]>(initialSlices);
  const [saved, setSaved] = useState(false);

  const total = slices.reduce((s, sl) => s + sl.percent, 0);
  const valid = total === 100;

  const updateSlice = useCallback((bucket: BucketType, rawValue: number) => {
    setSaved(false);
    const value = Math.max(0, Math.min(100, rawValue));
    setSlices((prev) => {
      const others = prev.filter((s) => s.bucket !== bucket);
      const otherTotal = others.reduce((s, sl) => s + sl.percent, 0);
      // Clamp so we never exceed 100
      const clamped = Math.min(value, 100 - otherTotal);
      return prev.map((s) => s.bucket === bucket ? { ...s, percent: clamped } : s);
    });
  }, []);

  function handleSave() {
    if (!valid) return;
    // TODO Phase 3: persist to Supabase allocation_rules table
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
      {/* Header */}
      <div>
        <p className="text-label" style={{ marginBottom: "8px" }}>Rules</p>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "2rem", color: "var(--color-ink-900)", letterSpacing: "-0.02em" }}>
          Allocation rules
        </h2>
        <p style={{ fontSize: "0.9375rem", color: "var(--color-ink-500)", marginTop: "8px", maxWidth: "520px" }}>
          Set how each incoming payment is automatically split. Percentages must add up to 100%.
        </p>
      </div>

      {/* Donut chart approximation — CSS bar */}
      <div style={{ display: "flex", height: "10px", borderRadius: "100px", overflow: "hidden", gap: "2px" }}>
        {ORDER.map((bucket) => {
          const slice = slices.find((s) => s.bucket === bucket);
          const pct = slice?.percent ?? 0;
          return (
            <div
              key={bucket}
              style={{
                flex: pct, minWidth: pct > 0 ? "4px" : "0",
                backgroundColor: BUCKET_CONFIG[bucket].color,
                transition: "flex 0.3s ease",
                borderRadius: "2px",
              }}
            />
          );
        })}
      </div>

      {/* Sliders */}
      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        {ORDER.map((bucket) => {
          const slice = slices.find((s) => s.bucket === bucket)!;
          const cfg = BUCKET_CONFIG[bucket];
          return (
            <div key={bucket}>
              {/* Label row */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{
                    display: "inline-block", width: "10px", height: "10px", borderRadius: "50%",
                    backgroundColor: cfg.color, flexShrink: 0
                  }} />
                  <span style={{ fontWeight: 600, fontSize: "0.9375rem", color: "var(--color-ink-900)" }}>
                    {cfg.label}
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <input
                    type="number"
                    min="0" max="100"
                    value={slice.percent}
                    onChange={(e) => updateSlice(bucket, parseInt(e.target.value, 10) || 0)}
                    style={{
                      width: "64px", padding: "6px 10px", border: "1.5px solid var(--color-border)",
                      borderRadius: "6px", fontFamily: "var(--font-body)", fontSize: "0.9375rem",
                      fontWeight: 700, color: "var(--color-ink-900)", textAlign: "center",
                      backgroundColor: "#fff",
                    }}
                  />
                  <span style={{ fontSize: "0.875rem", color: "var(--color-ink-500)" }}>%</span>
                </div>
              </div>

              {/* Range slider */}
              <input
                type="range"
                min="0" max="100" step="1"
                value={slice.percent}
                onChange={(e) => updateSlice(bucket, parseInt(e.target.value, 10))}
                style={{ width: "100%", accentColor: cfg.color, cursor: "pointer" }}
              />

              {/* Estimated amount */}
              <p style={{ fontSize: "0.8125rem", color: "var(--color-ink-500)", marginTop: "6px" }}>
                On ₹1,00,000 income → <strong style={{ color: "var(--color-ink-700)" }}>₹{(slice.percent * 1000).toLocaleString("en-IN")}</strong>
              </p>
            </div>
          );
        })}
      </div>

      {/* Total + save */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "16px",
        padding: "20px 24px", borderRadius: "12px",
        backgroundColor: valid ? "var(--color-jade-light)" : "var(--color-saffron-light)",
        border: `1px solid ${valid ? "rgba(43,122,90,0.25)" : "rgba(232,135,42,0.25)"}`,
      }}>
        <div>
          <p style={{ fontWeight: 700, fontSize: "1.125rem", color: valid ? "var(--color-jade)" : "var(--color-saffron)" }}>
            Total: {total}%
          </p>
          <p style={{ fontSize: "0.8125rem", color: valid ? "var(--color-jade)" : "var(--color-saffron)", marginTop: "2px" }}>
            {valid ? "✓ Allocations balanced" : `${100 - total > 0 ? 100 - total + "% unallocated" : Math.abs(100 - total) + "% over budget"}`}
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={!valid}
          className="btn btn-primary"
          style={{ opacity: valid ? 1 : 0.45 }}
        >
          {saved ? "✓ Saved!" : "Save rule"}
        </button>
      </div>

      {/* Rule note */}
      <p style={{ fontSize: "0.8125rem", color: "var(--color-ink-300)" }}>
        Phase 3: Rules will be enforced atomically by the Router Soroban contract on every incoming Stellar payment.
      </p>
    </div>
  );
}
