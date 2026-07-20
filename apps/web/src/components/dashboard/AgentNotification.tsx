"use client";

import { useEffect, useState } from "react";
import AgentDecisionPanel from "./AgentDecisionPanel";
import { useDashboardContext } from "@/hooks/DashboardContext";
import type { AgentProposal } from "@/lib/ai/agent-engine";

interface DecisionRecord {
  id: string;
  status: "pending" | "partial" | "executed" | "failed";
  proposal_json: AgentProposal;
}

export default function AgentNotification() {
  const { profile, paymentEvents } = useDashboardContext();
  const [pendingDecisionId, setPendingDecisionId] = useState<string | null>(null);
  const [pendingProposal, setPendingProposal] = useState<AgentProposal | null>(null);
  const [show, setShow] = useState(false);

  // When payment events update, check for any pending decisions
  useEffect(() => {
    if (!profile) return;
    fetch("/api/ai/decisions")
      .then(res => res.json())
      .then(data => {
        const decs = data.decisions ?? [];
        const pending = decs.find((d: DecisionRecord) => d.status === "pending");
        if (pending) {
          setPendingDecisionId(pending.id);
          setPendingProposal(pending.proposal_json);
          setShow(true);
        } else {
          setShow(false);
          setPendingDecisionId(null);
          setPendingProposal(null);
        }
      })
      .catch(err => console.error("Failed to fetch pending decisions:", err));
  }, [profile, paymentEvents]); // Re-check when payments change (e.g., simulated or admin push)

  if (!show || !pendingDecisionId || !pendingProposal) return null;

  return (
    <div 
      style={{
        position: "fixed",
        top: "24px",
        right: "24px",
        width: "400px",
        zIndex: 9999,
        animation: "slideInRight 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
        boxShadow: "0 12px 32px rgba(0,0,0,0.15)",
        borderRadius: "12px",
      }}
    >
      <AgentDecisionPanel
        decisionId={pendingDecisionId}
        proposal={pendingProposal}
        onExecuted={() => {
          setTimeout(() => setShow(false), 2000); // hide after 2s of showing success
        }}
        onDismiss={() => setShow(false)}
      />
      <style>{`
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(50px) scale(0.95); }
          to { opacity: 1; transform: translateX(0) scale(1); }
        }
      `}</style>
    </div>
  );
}
