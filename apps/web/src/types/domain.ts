/**
 * DeliteX — Core Domain Model
 *
 * These types form the single source of truth for the application.
 * They are intentionally decoupled from the DB/blockchain layer so
 * they can be mapped to Supabase rows OR Stellar/Soroban structures
 * without changing upstream UI components.
 *
 * See docs/blockchain_mapping.md for the full mapping reference.
 */

// ─────────────────────────────────────────────────────────────
// Primitives
// ─────────────────────────────────────────────────────────────

/** ISO 4217 currency codes we support */
export type CurrencyCode = "USDC" | "EURC" | "USD" | "EUR" | "GBP" | "INR" | "XLM";

/** Fiat-settled or on-chain */
export type SettlementRail = "stellar" | "upi" | "neft" | "imps" | "swift";

/** Which bucket a payment/rule belongs to */
export type BucketType = "income" | "bills" | "family" | "savings";

/** Status of any payment event */
export type PaymentStatus =
  | "pending"
  | "completed"
  | "failed"
  | "processing";

// ─────────────────────────────────────────────────────────────
// User Profile
// ─────────────────────────────────────────────────────────────

export interface UserProfile {
  /** Matches auth.users.id in Supabase */
  id: string;
  email: string;
  fullName: string | null;
  avatarUrl: string | null;

  /** KYC status — required before real payouts */
  kycStatus: "none" | "pending" | "approved" | "rejected";

  /**
   * Stellar account public key.
   * Phase 3: This becomes the main settlement account.
   * NULL until user connects or creates a Stellar wallet.
   */
  stellarPublicKey: string | null;

  /** User's primary INR payout method */
  inrPayoutMethod: PayoutMethod | null;

  /** Notification preferences */
  notifyOnIncoming: boolean;
  notifyOnPayout: boolean;

  createdAt: string; // ISO-8601
  updatedAt: string;
}

export interface PayoutMethod {
  type: "upi" | "bank_account";
  /** UPI VPA or bank account number (masked) */
  identifier: string;
  label: string; // e.g. "SBI Savings", "PhonePe"
  isVerified: boolean;
}

// ─────────────────────────────────────────────────────────────
// Payment Events
// ─────────────────────────────────────────────────────────────

/**
 * A PaymentEvent is any money movement in the system.
 * Incoming = credits to the user's wallet.
 * Outgoing = debits (bills, family transfers, vault deposits).
 *
 * Phase 3: Each event will have a corresponding Stellar transaction ID.
 */
export interface PaymentEvent {
  id: string;
  userId: string;

  direction: "incoming" | "outgoing";
  bucket: BucketType;
  status: PaymentStatus;

  /** Amount in the source currency */
  amount: number;
  currency: CurrencyCode;

  /** Converted INR equivalent (approximate, at time of processing) */
  inrEquivalent: number | null;

  /** FX rate used for conversion */
  fxRate: number | null;
  fxSpreadPercent: number | null;

  /** Who sent / who received */
  counterparty: string | null; // name or wallet address
  description: string;

  /** Settlement details */
  rail: SettlementRail;

  /**
   * Phase 3: Populated once a real Stellar tx is submitted.
   * - stellarTxHash: Stellar transaction hash
   * - stellarLedger: ledger sequence number
   * - sorobanContractId: if routed through a Soroban contract
   */
  stellarTxHash: string | null;
  stellarLedger: number | null;
  sorobanContractId: string | null;

  settledAt: string | null; // ISO-8601 when the tx was finalized
  createdAt: string;
}

// ─────────────────────────────────────────────────────────────
// Buckets
// ─────────────────────────────────────────────────────────────

/**
 * A Bucket is a named pool of money the user manages.
 * In Phase 3: each bucket maps to a dedicated Stellar sub-account
 * or a Soroban vault contract position.
 */
export interface Bucket {
  type: BucketType;
  label: string;
  description: string;

  /** Current balance in INR equivalent */
  balanceInr: number;

  /** Balance in the native asset (USDC for income, INR for others) */
  balanceNative: number;
  nativeCurrency: CurrencyCode;

  /**
   * Phase 3:
   * - income bucket → Stellar account holding USDC/EURC
   * - savings bucket → Soroban vault contract address
   */
  stellarAccountOrContractId: string | null;
}

// ─────────────────────────────────────────────────────────────
// Allocation Rules
// ─────────────────────────────────────────────────────────────

/**
 * An AllocationRule defines what percentage of each incoming
 * payment is automatically routed to a bucket.
 *
 * Constraint: the sum of all rule percentages must equal 100.
 *
 * Phase 3: Rules are enforced on-chain by the Router Soroban contract.
 * The contract validates percentages and executes atomic swaps/transfers.
 */
export interface AllocationRule {
  id: string;
  userId: string;

  /** Human-readable name */
  name: string;

  /** Which income stream this applies to (null = all) */
  incomeSourceFilter: string | null;

  /** The allocations that must sum to 100% */
  allocations: AllocationSlice[];

  /** Whether this rule is currently active */
  isActive: boolean;

  /** If set, this rule was generated or suggested by the AI assistant */
  aiGenerated: boolean;
  aiPrompt: string | null;

  createdAt: string;
  updatedAt: string;
}

export interface AllocationSlice {
  bucket: BucketType;
  /** Percentage 0–100 */
  percent: number;
}

// ─────────────────────────────────────────────────────────────
// Bills (Recurring Obligations)
// ─────────────────────────────────────────────────────────────

/**
 * A Bill is a recurring payment obligation.
 * Phase 3: Bills are paid automatically by the AI agent via x402 protocol
 * or direct UPI/NEFT calls through the on-ramp integration.
 */
export interface Bill {
  id: string;
  userId: string;

  name: string; // "Rent", "Netflix", "Electricity - BESCOM"
  payee: string; // UPI VPA or bank account
  payeeType: "upi" | "bank_account" | "wallet";

  amount: number;
  currency: CurrencyCode;

  frequency: "monthly" | "weekly" | "quarterly" | "yearly" | "one_time";
  dueDayOfMonth: number | null; // 1–31 for monthly bills
  nextDueDate: string; // ISO-8601 date

  isPaused: boolean;
  isAutopayEnabled: boolean;

  lastPaidAt: string | null;
  lastPaidAmount: number | null;

  notes: string | null;
  createdAt: string;
}

// ─────────────────────────────────────────────────────────────
// Family Recipients (Remittance)
// ─────────────────────────────────────────────────────────────

/**
 * A FamilyRecipient is a trusted contact who receives regular transfers.
 * Phase 3: Transfers are atomic Stellar payments + on-ramp conversions.
 */
export interface FamilyRecipient {
  id: string;
  userId: string;

  name: string;
  relationship: string; // "Parent", "Sibling", "Spouse" etc.
  avatarInitials: string;

  payeeType: "upi" | "bank_account";
  payeeIdentifier: string; // UPI VPA or masked bank account
  payeeLabel: string; // e.g. "PhonePe", "SBI Main"

  /** Recurring allowance (optional) */
  monthlyAllowance: number | null; // INR
  allowanceEnabled: boolean;

  /** Last transfer */
  lastTransferAmount: number | null;
  lastTransferAt: string | null;

  totalTransferredInr: number;

  notes: string | null;
  createdAt: string;
}

// ─────────────────────────────────────────────────────────────
// Savings / Vault
// ─────────────────────────────────────────────────────────────

/**
 * The SavingsVault is the yield-generating component.
 *
 * Phase 3: This maps directly to a Soroban vault contract.
 * The contract accepts USDC deposits, participates in a yield strategy,
 * and issues vault shares as proof of deposit.
 */
export interface SavingsVault {
  id: string;
  userId: string;

  /** Current deposited principal */
  principalUsdc: number;

  /** Current total value (principal + yield) */
  totalValueUsdc: number;

  /** Accrued yield */
  yieldEarnedUsdc: number;

  /** Estimated APY (%) — sourced from the contract or aggregator */
  estimatedApyPercent: number;

  /** Phase 3: Soroban vault contract ID */
  sorobanContractId: string | null;

  /** Phase 3: Number of vault shares held by this user */
  vaultSharesHeld: number | null;

  /** Auto-deposit: surplus above this INR threshold goes to vault */
  autoDepositThresholdInr: number | null;
  autoDepositEnabled: boolean;

  lastYieldClaimedAt: string | null;
  updatedAt: string;
}

// ─────────────────────────────────────────────────────────────
// AI Assistant
// ─────────────────────────────────────────────────────────────

/** A single message in the AI assistant chat thread */
export interface AiMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;

  /**
   * If the assistant parsed a rule from this message,
   * it will populate this field for user confirmation.
   */
  parsedRule: Partial<AllocationRule> | null;

  /**
   * Phase 3+: This maps to an LLM call with a structured output schema.
   * The schema validates parsed rules before applying them.
   */
  llmModel: string | null;
  llmLatencyMs: number | null;

  createdAt: string;
}
