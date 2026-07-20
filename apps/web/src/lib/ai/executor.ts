/**
 * Executor — dispatches approved agent decisions to payment providers.
 * Called ONLY after explicit user approval. Records all outcomes.
 */
import { createClient } from "@supabase/supabase-js";
import type { AgentProposal, AgentProposalItem } from "@/lib/ai/agent-engine";

export interface ExecutionResult {
  decisionId: string;
  success: boolean;
  items: {
    bucket: string;
    status: "executed" | "failed";
    txHash?: string;
    error?: string;
  }[];
  executedAt: string;
}

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/** Mock executor for a single proposal item — swappable with real API calls */
async function executeItem(item: AgentProposalItem): Promise<{ txHash: string; success: boolean; error?: string }> {
  // In production: bills → x402 /api/x402/pay-bill, family → /api/onramp/convert, savings → vault
  // For now: simulate with a 300–700ms delay and return a mock hash
  await new Promise((res) => setTimeout(res, 300 + Math.random() * 400));

  const successRate = 0.95; // 95% simulated success
  if (Math.random() > successRate) {
    return { txHash: "", success: false, error: "Simulated network timeout" };
  }

  const prefix: Record<string, string> = {
    bills: "x402_tx",
    family: "onramp_tx",
    savings: "vault_tx",
    income: "hold_tx",
  };
  const txHash = `${prefix[item.bucket] ?? "tx"}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

  return { txHash, success: true };
}

/**
 * Execute an approved agent decision.
 * Reads the pending decision from DB, runs each item, records outcomes.
 */
export async function executeDecision(decisionId: string, userId: string): Promise<ExecutionResult> {
  const supabase = getServiceClient();

  // Fetch the decision
  const { data: decision, error: fetchErr } = await supabase
    .from("agent_decisions")
    .select("*")
    .eq("id", decisionId)
    .eq("user_id", userId)
    .single();

  if (fetchErr || !decision) {
    throw new Error("Decision not found or unauthorized");
  }
  if (decision.status !== "pending") {
    throw new Error(`Decision is already ${decision.status}`);
  }

  const proposal = decision.proposal_json as AgentProposal;
  const itemResults: ExecutionResult["items"] = [];

  // Execute each item sequentially (safer for financial ops)
  for (const item of proposal.items) {
    const result = await executeItem(item);

    // Insert item record
    await supabase.from("agent_decision_items").insert({
      decision_id: decisionId,
      bucket: item.bucket,
      description: item.description,
      amount_usdc: item.amountUsdc,
      status: result.success ? "executed" : "failed",
      tx_hash: result.txHash || null,
      executed_at: new Date().toISOString(),
    });

    itemResults.push({
      bucket: item.bucket,
      status: result.success ? "executed" : "failed",
      txHash: result.txHash || undefined,
      error: result.error,
    });
  }

  const allSuccess = itemResults.every((r) => r.status === "executed");
  const executedAt = new Date().toISOString();

  // Update decision status
  await supabase
    .from("agent_decisions")
    .update({ status: allSuccess ? "executed" : "partial", executed_at: executedAt })
    .eq("id", decisionId);

  return {
    decisionId,
    success: allSuccess,
    items: itemResults,
    executedAt,
  };
}
