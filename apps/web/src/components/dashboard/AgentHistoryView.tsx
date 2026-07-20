/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useState, useEffect, useCallback } from "react";
import type { AgentProposal } from "@/lib/ai/agent-engine";
import AgentDecisionPanel from "@/components/dashboard/AgentDecisionPanel";
import type { ExecutionResult } from "@/lib/ai/executor";
import AiAssistant from "@/components/dashboard/AiAssistant";

interface DecisionRecord {
  id: string;
  status: "pending" | "approved" | "rejected" | "executed" | "partial";
  total_usdc: number;
  proposal_json: AgentProposal;
  created_at: string;
  executed_at: string | null;
  agent_decision_items: {
    id: string;
    bucket: string;
    description: string;
    amount_usdc: number;
    status: string;
    tx_hash: string | null;
    executed_at: string | null;
  }[];
}

const STATUS_COLORS: Record<string, { bg: string; fg: string; label: string }> = {
  pending:  { bg: "#FEF3C7", fg: "#92400E", label: "Pending" },
  approved: { bg: "#DBEAFE", fg: "#1E40AF", label: "Approved" },
  executed: { bg: "var(--color-jade-light)", fg: "var(--color-jade)", label: "Executed" },
  partial:  { bg: "#FEF3C7", fg: "#92400E", label: "Partial" },
  rejected: { bg: "#FEF2F2", fg: "#C0392B", label: "Rejected" },
};

const BUCKET_ICONS: Record<string, string> = {
  bills: "📄", family: "👨‍👩‍👧", savings: "🏦", income: "💼",
};

export default function AgentHistoryView() {
  const [decisions, setDecisions] = useState<DecisionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [pendingDecisionId, setPendingDecisionId] = useState<string | null>(null);
  const [pendingProposal, setPendingProposal] = useState<AgentProposal | null>(null);
  const [activeTab, setActiveTab] = useState<"agent" | "history">("agent");

  const fetchDecisions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/ai/decisions");
      const data = await res.json();
      setDecisions(data.decisions ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDecisions(); }, [fetchDecisions]);

  function handlePendingDecision(decisionId: string) {
    // Fetch the proposal for this decision ID
    fetch("/api/ai/decisions")
      .then((r) => r.json())
      .then((data) => {
        const found = (data.decisions ?? []).find((d: DecisionRecord) => d.id === decisionId);
        if (found) {
          setPendingDecisionId(decisionId);
          setPendingProposal(found.proposal_json);
          setActiveTab("history");
          fetchDecisions();
        }
      });
  }

  function handleExecuted(result: ExecutionResult) {
    setPendingDecisionId(null);
    setPendingProposal(null);
    fetchDecisions();
    console.log("Execution result:", result);
  }

  function toggleExpand(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header */}
      <div>
        <p className="text-label" style={{ marginBottom: "8px" }}>Agent</p>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "2rem", color: "var(--color-ink-900)", letterSpacing: "-0.02em" }}>
          AI Agent
        </h2>
        <p style={{ fontSize: "0.875rem", color: "var(--color-ink-500)", marginTop: "6px" }}>
          Chat with your AI assistant, review proposals, and track every automated decision.
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "4px", borderBottom: "1px solid var(--color-border)", paddingBottom: "0" }}>
        {[
          { id: "agent" as const, label: "✦ AI Assistant" },
          { id: "history" as const, label: `History${decisions.filter(d => d.status === "pending").length > 0 ? ` 🔴` : ""}` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: "10px 16px", border: "none", backgroundColor: "transparent",
              borderBottom: activeTab === tab.id ? "2px solid var(--color-saffron)" : "2px solid transparent",
              color: activeTab === tab.id ? "var(--color-saffron)" : "var(--color-ink-500)",
              fontFamily: "var(--font-body)", fontSize: "0.875rem", fontWeight: activeTab === tab.id ? 600 : 400,
              cursor: "pointer", marginBottom: "-1px", transition: "color 0.15s",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "agent" && (
        <AiAssistant onPendingDecision={handlePendingDecision} />
      )}

      {activeTab === "history" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Pending decision panel */}
          {pendingDecisionId && pendingProposal && (
            <AgentDecisionPanel
              decisionId={pendingDecisionId}
              proposal={pendingProposal}
              onExecuted={handleExecuted}
              onDismiss={() => { setPendingDecisionId(null); setPendingProposal(null); }}
            />
          )}

          {/* Simulate button */}
          <div className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
            <div>
              <p style={{ fontWeight: 600, fontSize: "0.875rem", color: "var(--color-ink-900)" }}>Simulate Incoming Payment</p>
              <p style={{ fontSize: "0.8125rem", color: "var(--color-ink-500)", marginTop: "2px" }}>Generate a $500 USDC allocation proposal to test the end-to-end flow</p>
            </div>
            <button
              className="btn btn-primary"
              style={{ flexShrink: 0 }}
              onClick={async () => {
                const res = await fetch("/api/ai/propose", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ amountUsdc: 500, fxRate: 84.5 }),
                });
                const data = await res.json();
                if (res.ok) {
                  setPendingDecisionId(data.decisionId);
                  setPendingProposal(data.proposal);
                  fetchDecisions();
                }
              }}
            >
              ▶ Simulate $500 Payment
            </button>
          </div>

          {/* History list */}
          <div>
            <p style={{ fontSize: "0.75rem", color: "var(--color-ink-500)", marginBottom: "12px" }}>
              {loading ? "Loading…" : `${decisions.length} decision${decisions.length !== 1 ? "s" : ""} total`}
            </p>
            {!loading && decisions.length === 0 && (
              <div className="card" style={{ textAlign: "center", padding: "40px", color: "var(--color-ink-300)" }}>
                No agent decisions yet. Simulate a payment above to get started.
              </div>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {decisions.map((d) => {
                const s = STATUS_COLORS[d.status] ?? STATUS_COLORS.pending;
                const isOpen = expanded.has(d.id);
                return (
                  <div key={d.id} className="card" style={{ padding: "0", overflow: "hidden" }}>
                    <button
                      onClick={() => toggleExpand(d.id)}
                      style={{ width: "100%", padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font-body)", gap: "12px", flexWrap: "wrap" }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "12px", textAlign: "left" }}>
                        <span style={{ padding: "3px 10px", borderRadius: "100px", backgroundColor: s.bg, color: s.fg, fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", flexShrink: 0 }}>
                          {s.label}
                        </span>
                        <div>
                          <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--color-ink-900)" }}>
                            ${d.total_usdc?.toFixed(2) ?? "0.00"} USDC allocation
                          </p>
                          <p style={{ fontSize: "0.75rem", color: "var(--color-ink-400)", marginTop: "1px" }}>
                            {new Date(d.created_at).toLocaleString("en-IN")}
                          </p>
                        </div>
                      </div>
                      <span style={{ color: "var(--color-ink-300)", fontSize: "1rem", flexShrink: 0 }}>
                        {isOpen ? "▲" : "▼"}
                      </span>
                    </button>

                    {isOpen && d.agent_decision_items && (
                      <div style={{ borderTop: "1px solid var(--color-border)", padding: "12px 16px", backgroundColor: "var(--color-bg)" }}>
                        {d.agent_decision_items.length === 0 ? (
                          <p style={{ fontSize: "0.8125rem", color: "var(--color-ink-400)" }}>No items recorded (decision not yet executed)</p>
                        ) : (
                          d.agent_decision_items.map((item) => (
                            <div key={item.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "8px 0", borderBottom: "1px solid var(--color-border)" }}>
                              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                                <span>{BUCKET_ICONS[item.bucket] ?? "•"}</span>
                                <div>
                                  <p style={{ fontSize: "0.8125rem", color: "var(--color-ink-700)" }}>{item.description}</p>
                                  {item.tx_hash && (
                                    <p style={{ fontSize: "0.7rem", color: "var(--color-ink-300)", fontFamily: "monospace", marginTop: "2px" }}>{item.tx_hash}</p>
                                  )}
                                </div>
                              </div>
                              <div style={{ textAlign: "right", flexShrink: 0 }}>
                                <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--color-ink-900)" }}>${item.amount_usdc}</p>
                                <p style={{ fontSize: "0.7rem", color: item.status === "executed" ? "var(--color-jade)" : "#C0392B", fontWeight: 600, marginTop: "2px" }}>
                                  {item.status}
                                </p>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
