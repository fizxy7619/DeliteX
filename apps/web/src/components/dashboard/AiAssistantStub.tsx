/* eslint-disable react-hooks/purity */
"use client";

import { useState, useRef, useEffect, type FormEvent } from "react";
import type { AiMessage } from "@/types/domain";
import { MOCK_AI_MESSAGES } from "@/lib/mock-data";

// Stubbed NLP parser — returns a canned response based on keyword matching.
// Phase 3: Replace this with a call to /api/ai/parse-intent (GPT-4o / Gemini).
function parseStubResponse(input: string): string {
  const lower = input.toLowerCase();

  if (lower.includes("rent") || lower.includes("bills first")) {
    return "Got it! I've noted that rent and bills should be prioritized. In your Rules, the Bills bucket is currently set to 40% — that means bills are always funded first from incoming payments. Want me to increase that?";
  }
  if (lower.includes("parent") || lower.includes("family") || lower.includes("mom") || lower.includes("dad")) {
    const match = lower.match(/(\d+)\s*%/);
    const pct = match ? match[1] : "15";
    return `Understood! I can set your Family allocation to ${pct}%. This means ₹${(parseInt(pct, 10) * 1000).toLocaleString("en-IN")} of every ₹1 lakh you receive goes automatically to your family recipients. Head to the Rules tab to confirm and save.`;
  }
  if (lower.includes("savings") || lower.includes("save") || lower.includes("vault")) {
    return "Saving more is a great call! I recommend routing surplus (above a threshold) automatically to the Soroban yield vault. You can set this in the Savings tab. What threshold should I use — ₹50,000 or a custom amount?";
  }
  if (lower.includes("how") && (lower.includes("fee") || lower.includes("cost") || lower.includes("fx"))) {
    return "Our FX spread is under 0.3% via the Stellar DEX, compared to 3–7% for traditional wires. On ₹10 lakh of annual income that's ₹27,000–67,000 saved per year. No hidden markup.";
  }
  if (lower.includes("help") || lower.includes("what can you")) {
    return "I can help you: set allocation rules (e.g. 'Allocate 20% to savings'), manage recurring bills ('Pause Netflix'), understand your FX costs, or set up family allowances. What would you like to do?";
  }

  return "That's a great idea! I've made a note of it. For now, head to the Rules or Bills tab to make this change directly. In Phase 3, I'll be able to apply changes automatically from natural language instructions.";
}

function MessageBubble({ msg }: { msg: AiMessage }) {
  const isUser = msg.role === "user";
  return (
    <div
      style={{
        display: "flex",
        justifyContent: isUser ? "flex-end" : "flex-start",
        marginBottom: "12px",
      }}
    >
      {!isUser && (
        <div style={{
          width: "30px", height: "30px", borderRadius: "50%", flexShrink: 0, marginRight: "8px", marginTop: "4px",
          backgroundColor: "var(--color-jade-light)",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "var(--color-jade)", fontSize: "0.75rem", fontWeight: 700,
        }}>
          AI
        </div>
      )}
      <div
        style={{
          maxWidth: "72%",
          padding: "12px 16px",
          borderRadius: isUser ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
          backgroundColor: isUser ? "var(--color-ink-900)" : "#fff",
          color: isUser ? "#fff" : "var(--color-ink-700)",
          fontSize: "0.875rem",
          lineHeight: 1.65,
          border: isUser ? "none" : "1px solid var(--color-border)",
          boxShadow: isUser ? "none" : "0 1px 3px rgba(0,0,0,0.04)",
        }}
      >
        {msg.content}
      </div>
    </div>
  );
}

const SUGGESTIONS = [
  "Always pay rent first",
  "Allocate 10% to my parents",
  "Put surplus into savings",
  "What are my FX fees?",
];

export default function AiAssistantStub() {
  const [messages, setMessages] = useState<AiMessage[]>(MOCK_AI_MESSAGES);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function sendMessage(text: string) {
    if (!text.trim() || loading) return;
    setLoading(true);
    setInput("");

    const userMsg: AiMessage = {
      id: `msg_${Date.now()}`,
      role: "user",
      content: text.trim(),
      parsedRule: null,
      llmModel: null,
      llmLatencyMs: null,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);

    // Simulate a 600–1100ms response delay
    const delay = 600 + Math.random() * 500;
    setTimeout(() => {
      const assistantMsg: AiMessage = {
        id: `msg_${Date.now() + 1}`,
        role: "assistant",
        content: parseStubResponse(text),
        parsedRule: null,
        llmModel: "stub-v0 (Phase 3: GPT-4o)",
        llmLatencyMs: Math.round(delay),
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
      setLoading(false);
    }, delay);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    sendMessage(input);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px", height: "100%" }}>
      {/* Header */}
      <div>
        <p className="text-label" style={{ marginBottom: "8px" }}>AI Assistant</p>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "2rem", color: "var(--color-ink-900)", letterSpacing: "-0.02em" }}>
          Your finance agent
        </h2>
        <p style={{ fontSize: "0.875rem", color: "var(--color-ink-500)", marginTop: "6px" }}>
          Describe what you want in plain English. The agent will set rules and automate payments.
        </p>
      </div>

      {/* LLM stub note */}
      <div style={{
        display: "flex", alignItems: "center", gap: "10px", padding: "10px 14px",
        backgroundColor: "#FFFBEB", borderRadius: "8px", border: "1px solid rgba(234,179,8,0.3)"
      }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#CA8A04" strokeWidth="2"><path d="M12 2v20M2 12h20"/><circle cx="12" cy="12" r="10"/></svg>
        <p style={{ fontSize: "0.8125rem", color: "#92400E", lineHeight: 1.5 }}>
          <strong>Phase 2 stub:</strong> Responses are rule-based. Phase 3 will use GPT-4o / Gemini with structured outputs to apply changes automatically.
        </p>
      </div>

      {/* Chat window */}
      <div
        style={{
          flex: 1, minHeight: "320px", maxHeight: "480px",
          overflowY: "auto", border: "1px solid var(--color-border)",
          borderRadius: "12px", padding: "20px",
          backgroundColor: "var(--color-bg)",
          display: "flex", flexDirection: "column",
        }}
      >
        {messages.map((msg) => <MessageBubble key={msg.id} msg={msg} />)}

        {loading && (
          <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: "12px" }}>
            <div style={{
              width: "30px", height: "30px", borderRadius: "50%", marginRight: "8px", marginTop: "4px",
              backgroundColor: "var(--color-jade-light)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "var(--color-jade)", fontSize: "0.75rem", fontWeight: 700,
            }}>AI</div>
            <div style={{
              padding: "14px 18px", borderRadius: "16px 16px 16px 4px",
              backgroundColor: "#fff", border: "1px solid var(--color-border)",
              display: "flex", gap: "6px", alignItems: "center",
            }}>
              {[0, 0.15, 0.3].map((d, i) => (
                <span key={i} style={{
                  width: "7px", height: "7px", borderRadius: "50%", backgroundColor: "var(--color-ink-300)",
                  animation: "typing-dot 1.2s infinite ease-in-out",
                  animationDelay: `${d}s`,
                }} />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick suggestions */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            onClick={() => sendMessage(s)}
            disabled={loading}
            style={{
              padding: "7px 14px", border: "1px solid var(--color-border)",
              borderRadius: "100px", backgroundColor: "#fff",
              fontSize: "0.8125rem", color: "var(--color-ink-700)",
              cursor: "pointer", fontFamily: "var(--font-body)",
              transition: "border-color 0.15s, background 0.15s",
            }}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} style={{ display: "flex", gap: "10px" }}>
        <input
          type="text"
          className="input"
          placeholder='Try "Allocate 20% to savings" or "Always pay rent first"'
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
        @keyframes typing-dot {
          0%, 80%, 100% { transform: scale(1); opacity: 0.4; }
          40% { transform: scale(1.3); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
