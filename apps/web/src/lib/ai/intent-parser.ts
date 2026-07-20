/**
 * Intent Parser — converts user natural language into structured ParsedIntent.
 * Uses NVIDIA Nemotron via NIM API with JSON-mode output.
 * Falls back to keyword matching if NVIDIA_API_KEY is not set.
 */
import { callLLM } from "@/lib/ai/provider";
import type { BucketType } from "@/types/domain";

export interface ParsedIntent {
  intent:
    | "set_allocation"
    | "pause_bill"
    | "resume_bill"
    | "ask_question"
    | "set_allowance"
    | "simulate_payment"
    | "other";
  allocations?: { bucket: BucketType; percent: number }[];
  billId?: string;
  recipientId?: string;
  amount?: number;
  /** Human-readable explanation the AI will show back to the user */
  explanation: string;
  /** 0–1 confidence */
  confidence: number;
  /** Which model generated this (nvidia-nim or fallback) */
  source: "nvidia-nim" | "fallback";
  latencyMs: number;
}

const SYSTEM_PROMPT = `You are the AI finance assistant for DeliteX, an agentic remittance and payments OS for Indian freelancers and NRIs.

DeliteX lets users:
- Receive global payments in USDC/EURC on Stellar
- Auto-route money to four buckets: income, bills, family, savings
- Pay recurring bills automatically
- Send money to family in India via UPI/IMPS
- Earn yield on savings via a Soroban vault

Your job is to parse the user's natural-language instruction into a structured JSON intent.

IMPORTANT RULES:
1. Allocations MUST sum to 100% if the user says "all", "everything", or gives a complete breakdown.
2. Partial allocations (e.g. "put 20% to savings") are allowed — you output only the mentioned bucket.
3. Never make up bill IDs or recipient IDs. Leave them undefined if not mentioned.
4. Be friendly and clear. The explanation should confirm what you understood.

You MUST respond with ONLY valid JSON, no markdown, no extra text:
{
  "intent": "set_allocation" | "pause_bill" | "resume_bill" | "ask_question" | "set_allowance" | "simulate_payment" | "other",
  "allocations": [{ "bucket": "income"|"bills"|"family"|"savings", "percent": number }],
  "amount": number | null,
  "explanation": "string - what you will do, in plain English",
  "confidence": number (0.0 to 1.0)
}`;

/** Keyword-based fallback when LLM is unavailable */
function keywordFallback(text: string): ParsedIntent {
  const lower = text.toLowerCase();
  const start = Date.now();

  if (lower.includes("simulat") || lower.includes("test payment") || lower.includes("incoming")) {
    return { intent: "simulate_payment", explanation: "Simulating an incoming payment to generate an agent proposal.", confidence: 0.9, source: "fallback", latencyMs: Date.now() - start };
  }

  const pctMatch = lower.match(/(\d+)\s*%/);
  const pct = pctMatch ? parseInt(pctMatch[1], 10) : null;

  if (lower.includes("saving") || lower.includes("vault") || lower.includes("save")) {
    return { intent: "set_allocation", allocations: [{ bucket: "savings", percent: pct ?? 20 }], explanation: `I'll allocate ${pct ?? 20}% of your incoming payments to savings/vault.`, confidence: 0.8, source: "fallback", latencyMs: Date.now() - start };
  }
  if (lower.includes("family") || lower.includes("parent") || lower.includes("mom") || lower.includes("dad")) {
    return { intent: "set_allocation", allocations: [{ bucket: "family", percent: pct ?? 15 }], explanation: `I'll allocate ${pct ?? 15}% of your incoming payments to family transfers.`, confidence: 0.8, source: "fallback", latencyMs: Date.now() - start };
  }
  if (lower.includes("rent") || lower.includes("bill") || lower.includes("bills first")) {
    return { intent: "set_allocation", allocations: [{ bucket: "bills", percent: pct ?? 40 }], explanation: `I'll allocate ${pct ?? 40}% of your incoming payments to cover bills.`, confidence: 0.75, source: "fallback", latencyMs: Date.now() - start };
  }
  if (lower.includes("fee") || lower.includes("fx") || lower.includes("cost") || lower.includes("how much")) {
    return { intent: "ask_question", explanation: "Our FX spread is under 0.3% via Stellar DEX, vs 3–7% for traditional wires. On ₹10 lakh annual income, you save ₹27,000–67,000/year.", confidence: 0.95, source: "fallback", latencyMs: Date.now() - start };
  }

  return { intent: "other", explanation: "I'm not sure what you meant. Try: 'Allocate 20% to savings', 'Always pay bills first', or 'Send 10% to family'.", confidence: 0.3, source: "fallback", latencyMs: Date.now() - start };
}

/** Parse user text into a structured intent using NVIDIA Nemotron */
export async function parseIntent(userText: string): Promise<ParsedIntent> {
  const start = Date.now();

  const llmResponse = await callLLM([
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: userText },
  ], { maxTokens: 512, temperature: 0.1 });

  if (!llmResponse) {
    return keywordFallback(userText);
  }

  try {
    // Strip possible markdown code fences
    const raw = llmResponse.content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const parsed = JSON.parse(raw);

    return {
      intent: parsed.intent ?? "other",
      allocations: parsed.allocations ?? undefined,
      billId: parsed.billId ?? undefined,
      recipientId: parsed.recipientId ?? undefined,
      amount: parsed.amount ?? undefined,
      explanation: parsed.explanation ?? "Done.",
      confidence: parsed.confidence ?? 0.7,
      source: "nvidia-nim",
      latencyMs: llmResponse.latencyMs,
    };
  } catch {
    console.warn("[IntentParser] Failed to parse LLM JSON, falling back to keywords");
    return keywordFallback(userText);
  }
}
