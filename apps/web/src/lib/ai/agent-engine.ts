/**
 * Agent Engine — generates allocation proposals from user rules + payment amount.
 * This is pure computation: reads from DB, produces a proposal. Never executes.
 */
import { createClient } from "@supabase/supabase-js";
import type { BucketType } from "@/types/domain";

export interface AgentProposalItem {
  bucket: BucketType;
  label: string;
  amountUsdc: number;
  amountInr: number;
  description: string;
  percent: number;
}

export interface AgentProposal {
  id: string;
  totalUsdc: number;
  totalInr: number;
  fxRate: number;
  items: AgentProposalItem[];
  summary: string;
  createdAt: string;
}

// Default fallback allocations when no rule is set in DB
const DEFAULT_ALLOCATIONS = [
  { bucket: "bills" as BucketType, percent: 40 },
  { bucket: "family" as BucketType, percent: 15 },
  { bucket: "savings" as BucketType, percent: 30 },
  { bucket: "income" as BucketType, percent: 15 },
];

const BUCKET_LABELS: Record<BucketType, string> = {
  income: "Keep as income",
  bills: "Pay bills",
  family: "Family transfers",
  savings: "Vault savings",
};

const BUCKET_DESCRIPTIONS: Record<BucketType, string> = {
  income: "Held in your USDC wallet for discretionary use",
  bills: "Auto-pay recurring bills via x402 protocol",
  family: "Converted to INR and sent via UPI/IMPS",
  savings: "Deposited into Soroban yield vault (~5.8% APY)",
};

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/**
 * Generate an agent proposal for an incoming payment.
 * Reads the user's active allocation rule, falls back to defaults.
 */
export async function generateProposal(
  userId: string,
  amountUsdc: number,
  fxRate = 84.5
): Promise<AgentProposal> {
  const supabase = getServiceClient();

  // Fetch active allocation rule
  const { data: rule } = await supabase
    .from("allocation_rules")
    .select("allocations")
    .eq("user_id", userId)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  const allocations: { bucket: BucketType; percent: number }[] =
    rule?.allocations ?? DEFAULT_ALLOCATIONS;

  const totalInr = amountUsdc * fxRate;

  const items: AgentProposalItem[] = allocations.map((alloc) => {
    const amtUsdc = parseFloat(((amountUsdc * alloc.percent) / 100).toFixed(4));
    const amtInr = parseFloat(((totalInr * alloc.percent) / 100).toFixed(0));
    return {
      bucket: alloc.bucket,
      label: BUCKET_LABELS[alloc.bucket],
      amountUsdc: amtUsdc,
      amountInr: amtInr,
      description: BUCKET_DESCRIPTIONS[alloc.bucket],
      percent: alloc.percent,
    };
  });

  const summary = items
    .map((i) => `${i.label}: ₹${i.amountInr.toLocaleString("en-IN")} (${i.percent}%)`)
    .join(" · ");

  return {
    id: `prop_${Date.now().toString(36)}`,
    totalUsdc: amountUsdc,
    totalInr,
    fxRate,
    items,
    summary,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Save a proposal to the DB as a pending agent_decision.
 * Returns the saved decision ID.
 */
export async function saveDecision(
  userId: string,
  proposal: AgentProposal
): Promise<string> {
  const supabase = getServiceClient();

  const { data, error } = await supabase
    .from("agent_decisions")
    .insert({
      user_id: userId,
      proposal_json: proposal,
      total_usdc: proposal.totalUsdc,
      status: "pending",
    })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(`Failed to save decision: ${error?.message}`);
  }

  return data.id;
}
