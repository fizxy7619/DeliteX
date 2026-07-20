"use client";

import { useState, useRef, useEffect, useMemo, type FormEvent } from "react";
import type { AllocationRule, AiMessage } from "@/types/domain";
import type { ParsedIntent } from "@/lib/ai/intent-parser";

type DbAiMessage = AiMessage & {
  parsed_rule?: { allocations: { bucket: string; percent: number }[] };
  llm_model?: string;
  llm_latency_ms?: number;
};

// ─── Intent Card ──────────────────────────────────────────────
function IntentCard({ intent, onApply, onDismiss, isAlreadyApplied }: { intent: ParsedIntent; onApply: () => void; onDismiss: () => void; isAlreadyApplied?: boolean }) {
  const [applying, setApplying] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);

  // Derive applied state from props
  const applied = isAlreadyApplied;

  async function handleApply() {
    if (intent.intent !== "set_allocation" || !intent.allocations) { onApply(); return; }
    setApplying(true);
    setApplyError(null);
    try {
      const res = await fetch("/api/ai/apply-rule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          allocations: intent.allocations,
          name: "AI Generated Rule",
          aiPrompt: `Auto-applied from: ${intent.explanation}`,
        }),
      });
      if (res.ok) {
        onApply();
      } else {
        const err = await res.json();
        setApplyError(err.error || "Failed to apply rule");
      }
    } catch (e) {
      setApplyError((e as Error).message);
    } finally {
      setApplying(false);
    }
  }

  const bucketColors: Record<string, string> = {
    bills: "#E8872A", family: "#2B7A5A", savings: "#4F46E5", income: "#64748B",
  };

  return (
    <div style={{ marginTop: "8px", padding: "14px 16px", borderRadius: "12px", border: "1px solid rgba(43,122,90,0.3)", backgroundColor: "var(--color-jade-light)" }}>
      <p style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", color: "var(--color-jade)", marginBottom: "8px" }}>
        Proposed Rule
      </p>
      {intent.allocations && (
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "12px" }}>
          {intent.allocations.map((a) => (
            <span key={a.bucket} style={{ padding: "3px 10px", borderRadius: "100px", fontSize: "0.8125rem", fontWeight: 600, color: "#fff", backgroundColor: bucketColors[a.bucket] ?? "#64748B" }}>
              {a.bucket}: {a.percent}%
            </span>
          ))}
        </div>
      )}
      {applyError && (
        <p style={{ fontSize: "0.75rem", color: "#C0392B", marginBottom: "8px" }}>Error: {applyError}</p>
      )}
      {!applied ? (
        <div style={{ display: "flex", gap: "8px" }}>
          <button onClick={handleApply} disabled={applying} style={{ padding: "6px 14px", borderRadius: "6px", border: "none", backgroundColor: "var(--color-jade)", color: "#fff", fontSize: "0.8125rem", fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-body)" }}>
            {applying ? "Applying…" : "✓ Apply Rule"}
          </button>
          <button onClick={onDismiss} style={{ padding: "6px 14px", borderRadius: "6px", border: "1px solid rgba(43,122,90,0.4)", backgroundColor: "transparent", color: "var(--color-jade)", fontSize: "0.8125rem", cursor: "pointer", fontFamily: "var(--font-body)" }}>
            Dismiss
          </button>
        </div>
      ) : (
        <p style={{ fontSize: "0.8125rem", color: "var(--color-jade)", fontWeight: 600 }}>✓ Rule applied to your allocation!</p>
      )}
    </div>
  );
}

// ─── Message Bubble ───────────────────────────────────────────
function MessageBubble({ msg, activeRule, isLatestIntent, pendingIntent, isDismissed, onApply, onDismiss }: {
  msg: AiMessage;
  activeRule?: AllocationRule;
  isLatestIntent?: boolean;
  pendingIntent?: ParsedIntent | null;
  isDismissed?: boolean;
  onApply?: () => void;
  onDismiss?: () => void;
}) {
  const isUser = msg.role === "user";
  const dbMsg = msg as DbAiMessage;
  
  const isAlreadyApplied = useMemo(() => {
    if (!activeRule || !dbMsg.parsed_rule) return false;
    const sortedActive = [...activeRule.allocations].sort((a,b) => a.bucket.localeCompare(b.bucket));
    const sortedParsed = [...dbMsg.parsed_rule.allocations].sort((a,b) => a.bucket.localeCompare(b.bucket));
    return JSON.stringify(sortedActive) === JSON.stringify(sortedParsed);
  }, [activeRule, dbMsg.parsed_rule]);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: isUser ? "flex-end" : "flex-start", marginBottom: "14px" }}>
      <div style={{ display: "flex", alignItems: "flex-end", gap: "8px", flexDirection: isUser ? "row-reverse" : "row" }}>
        {!isUser && (
          <div style={{ width: "28px", height: "28px", borderRadius: "50%", flexShrink: 0, backgroundColor: "var(--color-jade-light)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-jade)", fontSize: "0.7rem", fontWeight: 700, marginBottom: "4px" }}>
            ✦
          </div>
        )}
        <div style={{ maxWidth: "75%", padding: "11px 15px", borderRadius: isUser ? "16px 16px 4px 16px" : "16px 16px 16px 4px", backgroundColor: isUser ? "var(--color-jade)" : "var(--color-bg-card)", color: isUser ? "#fff" : "var(--color-ink-700)", fontSize: "0.875rem", lineHeight: 1.65, border: isUser ? "none" : "1px solid var(--color-border)", boxShadow: isUser ? "none" : "0 1px 3px rgba(0,0,0,0.04)", whiteSpace: "pre-wrap" }}>
          {msg.content}
        </div>
      </div>

      {!isUser && !isDismissed && isLatestIntent && (pendingIntent?.intent === "set_allocation" || dbMsg.parsed_rule) && onApply && onDismiss && (
        <div style={{ paddingLeft: "36px", width: "100%" }}>
          <IntentCard
            intent={(pendingIntent ?? { intent: "set_allocation", allocations: dbMsg.parsed_rule?.allocations || [], explanation: msg.content, source: "nvidia-nim", latencyMs: 0, confidence: 1 }) as ParsedIntent}
            onApply={onApply}
            onDismiss={onDismiss}
            isAlreadyApplied={isAlreadyApplied}
          />
        </div>
      )}

      {!isUser && (msg.llmModel || dbMsg.llm_model) && (
        <p style={{ fontSize: "0.6875rem", color: "var(--color-ink-300)", paddingLeft: "36px", marginTop: "4px" }}>
          {msg.llmModel || dbMsg.llm_model} · {msg.llmLatencyMs || dbMsg.llm_latency_ms}ms
        </p>
      )}
    </div>
  );
}

// ─── Suggestions ──────────────────────────────────────────────
const SUGGESTIONS = [
  "Allocate 30% to savings",
  "Send 20% to family",
  "Pay bills first (40%)",
  "What are my FX fees?",
  "Simulate incoming payment",
];

// ─── Main Component ───────────────────────────────────────────
import { useDashboardContext } from "@/hooks/DashboardContext";

export default function AiAssistant({ onPendingDecision }: { onPendingDecision?: (id: string) => void }) {
  const { aiMessages, rules, refreshData } = useDashboardContext();
  const activeRule = useMemo(() => rules.find(r => r.isActive), [rules]);

  const displayMessages = useMemo(() => {
    return aiMessages && aiMessages.length > 0
      ? aiMessages
      : [{ id: "welcome", role: "assistant", content: "Hi! I'm your Delite AI Agent powered by NVIDIA Nemotron-4-340B.\n\nI can help you:\n• Set allocation rules (e.g. \"Allocate 30% to savings, 20% to family\")\n• Answer questions about your FX rates and fees\n• Simulate incoming payments to test your rules\n\nHow can I help today?", createdAt: new Date().toISOString(), parsedRule: null, llmModel: null, llmLatencyMs: null } as DbAiMessage];
  }, [aiMessages]);

  const latestIntentMessageId = useMemo(() => {
    for (let i = displayMessages.length - 1; i >= 0; i--) {
      const msg = displayMessages[i] as DbAiMessage;
      if (msg.parsed_rule) return msg.id;
    }
    return null;
  }, [displayMessages]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [dismissedRules, setDismissedRules] = useState<string[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [displayMessages]);

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return;
    setLoading(true);
    setInput("");
    setApiError(null);

    // Check for simulation intent before hitting LLM
    if (text.toLowerCase().includes("simulat") || text.toLowerCase().includes("test payment") || text.toLowerCase().includes("incoming")) {
      await handleSimulate();
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/ai/parse-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        if (res.status === 401) {
          setApiError("Session expired — please refresh the page and log in again.");
        } else {
          setApiError(errData.error || `Request failed (${res.status})`);
        }
        return;
      }

      // Refresh to show DB messages (both user msg + assistant reply)
      await refreshData();
    } catch (e) {
      setApiError("Network error: " + (e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSimulate() {
    setApiError(null);
    try {
      const res = await fetch("/api/ai/propose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amountUsdc: 500, fxRate: 84.5 }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        setApiError(errData.error || "Simulation failed");
        return;
      }

      const data = await res.json();
      if (data.decisionId && onPendingDecision) {
        onPendingDecision(data.decisionId);
      }
      await refreshData();
    } catch (e) {
      setApiError("Simulation failed: " + (e as Error).message);
    }
  }

  function handleSubmit(e: FormEvent) { e.preventDefault(); sendMessage(input); }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Header */}
      <div>
        <p className="text-label" style={{ marginBottom: "8px" }}>AI Assistant</p>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "2rem", color: "var(--color-ink-900)", letterSpacing: "-0.02em" }}>
          Your finance agent
        </h2>
        <p style={{ fontSize: "0.875rem", color: "var(--color-ink-500)", marginTop: "6px" }}>
          Powered by NVIDIA Nemotron-4-340B. Describe what you want in plain English.
        </p>
      </div>

      {/* Model badge */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "9px 14px", backgroundColor: "#F0FDF4", borderRadius: "8px", border: "1px solid rgba(43,122,90,0.25)" }}>
        <span style={{ fontSize: "1rem" }}>✦</span>
        <p style={{ fontSize: "0.8125rem", color: "#166534", lineHeight: 1.5 }}>
          <strong>NVIDIA Nemotron-4-340B</strong> via NIM API · Structured JSON output · Falls back to keyword matching if API key not set
        </p>
      </div>

      {/* API Error */}
      {apiError && (
        <div style={{ padding: "12px 16px", borderRadius: "8px", backgroundColor: "#FEF2F2", border: "1px solid rgba(192,57,43,0.3)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <p style={{ fontSize: "0.8125rem", color: "#C0392B" }}>⚠ {apiError}</p>
          <button onClick={() => setApiError(null)} style={{ background: "none", border: "none", color: "#C0392B", cursor: "pointer", fontSize: "1rem" }}>×</button>
        </div>
      )}

      {/* Chat window */}
      <div style={{ minHeight: "360px", maxHeight: "500px", overflowY: "auto", border: "1px solid var(--color-border)", borderRadius: "12px", padding: "20px", backgroundColor: "var(--color-bg)", display: "flex", flexDirection: "column" }}>
        {displayMessages.map((msg) => (
          <MessageBubble
            key={msg.id}
            msg={msg}
            activeRule={activeRule}
            isLatestIntent={msg.id === latestIntentMessageId}
            isDismissed={dismissedRules.includes(msg.id)}
            pendingIntent={dismissedRules.includes(msg.id) ? null : undefined}
            onApply={() => {
              setDismissedRules((prev) => [...prev, msg.id]);
              refreshData();
            }}
            onDismiss={() => setDismissedRules((prev) => [...prev, msg.id])}
          />
        ))}

        {loading && (
          <div style={{ display: "flex", alignItems: "flex-end", gap: "8px", marginBottom: "14px" }}>
            <div style={{ width: "28px", height: "28px", borderRadius: "50%", backgroundColor: "var(--color-jade-light)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-jade)", fontSize: "0.7rem", fontWeight: 700 }}>✦</div>
            <div style={{ padding: "12px 16px", borderRadius: "16px 16px 16px 4px", backgroundColor: "var(--color-bg-card)", border: "1px solid var(--color-border)", display: "flex", gap: "5px", alignItems: "center" }}>
              {[0, 0.15, 0.3].map((d, i) => (
                <span key={i} style={{ width: "7px", height: "7px", borderRadius: "50%", backgroundColor: "var(--color-jade)", animation: "pulse-dot 1.2s infinite ease-in-out", animationDelay: `${d}s`, display: "block" }} />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggestions */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
        {SUGGESTIONS.map((s) => (
          <button key={s} onClick={() => sendMessage(s)} disabled={loading} style={{ padding: "6px 14px", border: "1px solid var(--color-border)", borderRadius: "100px", backgroundColor: "var(--color-bg-card)", fontSize: "0.8125rem", color: "var(--color-ink-700)", cursor: "pointer", fontFamily: "var(--font-body)", transition: "border-color 0.15s" }}>
            {s}
          </button>
        ))}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} style={{ display: "flex", gap: "10px" }}>
        <input
          type="text"
          className="input"
          placeholder='Try "Allocate 30% to savings" or "Simulate incoming payment"'
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
          style={{ flex: 1 }}
        />
        <button type="submit" className="btn btn-saffron" disabled={loading || !input.trim()} style={{ flexShrink: 0 }}>
          Send
        </button>
      </form>

      <style>{`
        @keyframes pulse-dot {
          0%, 80%, 100% { transform: scale(1); opacity: 0.4; }
          40% { transform: scale(1.3); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
