/**
 * Soroban vault connector for the DeliteX yield layer.
 * Testnet mode: simulates contract interactions with realistic delays.
 * Production: replace stubs with actual Stellar SDK + Soroban RPC calls.
 */

export type VaultStrategy = "conservative" | "stable";

export interface VaultStrategyConfig {
  id: VaultStrategy;
  label: string;
  description: string;
  apyMin: number;
  apyMax: number;
  riskLevel: "low" | "medium";
  riskColor: string;
  mechanism: string;
  disclosure: string;
}

export const VAULT_STRATEGIES: VaultStrategyConfig[] = [
  {
    id: "conservative",
    label: "Conservative",
    description: "Maximum safety. Funds deposited into Soroban escrow, earning Stellar USDC staking rewards.",
    apyMin: 4.5,
    apyMax: 6.5,
    riskLevel: "low",
    riskColor: "#16A34A",
    mechanism: "Soroban escrow contract on Stellar testnet",
    disclosure:
      "Your USDC is locked in a non-custodial Soroban smart contract on the Stellar blockchain. Yield is generated from on-chain staking rewards distributed weekly. Principal is redeemable at any time. Smart contract risk applies. This is a testnet demonstration — no real funds are involved.",
  },
  {
    id: "stable",
    label: "Stable",
    description: "Slightly higher yield by allocating to a blended on-chain money-market strategy.",
    apyMin: 7.0,
    apyMax: 10.0,
    riskLevel: "medium",
    riskColor: "#D97706",
    mechanism: "Blended Soroban vault + on-chain money market",
    disclosure:
      "Your USDC is split between Soroban escrow (50%) and a blended on-chain money-market strategy (50%). Yield is higher but subject to liquidity risk during high-demand periods. Withdrawal may take up to 24 hours during peak periods. This is a testnet demonstration — no real funds are involved.",
  },
];

export interface DepositReceipt {
  positionId: string;
  amountUsdc: number;
  strategy: VaultStrategy;
  apyPercent: number;
  txHash: string;
  sorobanContractId: string;
  estimatedMonthlyYield: number;
  depositedAt: string;
}

export interface WithdrawReceipt {
  positionId: string;
  amountUsdc: number;
  yieldEarned: number;
  totalReceived: number;
  txHash: string;
  withdrawnAt: string;
}

export interface VaultPosition {
  id: string;
  amountUsdc: number;
  strategy: VaultStrategy;
  apyPercent: number;
  status: "active" | "withdrawn" | "pending";
  daysActive: number;
  yieldEarned: number;
  currentValue: number;
  txHash: string | null;
  createdAt: string;
}

const STUB_CONTRACT_ID = "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCN3";

/** Simulate deposit to Soroban vault (testnet stub) */
export async function depositToVault(
  amountUsdc: number,
  strategy: VaultStrategy
): Promise<DepositReceipt> {
  // Simulate network latency (300-700ms)
  await new Promise((r) => setTimeout(r, 300 + Math.floor(Math.random() * 400)));

  const config = VAULT_STRATEGIES.find((s) => s.id === strategy)!;
  const apy = config.apyMin + Math.random() * (config.apyMax - config.apyMin);
  const positionId = `pos_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const txHash = `stub_${Date.now().toString(16)}${Math.random().toString(16).slice(2, 10)}`;

  return {
    positionId,
    amountUsdc,
    strategy,
    apyPercent: parseFloat(apy.toFixed(2)),
    txHash,
    sorobanContractId: STUB_CONTRACT_ID,
    estimatedMonthlyYield: parseFloat(((amountUsdc * apy) / 100 / 12).toFixed(4)),
    depositedAt: new Date().toISOString(),
  };
}

/** Simulate withdrawal from Soroban vault (testnet stub) */
export async function withdrawFromVault(
  positionId: string,
  amountUsdc: number,
  apyPercent: number,
  daysActive: number
): Promise<WithdrawReceipt> {
  await new Promise((r) => setTimeout(r, 300 + Math.floor(Math.random() * 400)));

  const yieldEarned = parseFloat(((amountUsdc * apyPercent) / 100 / 365 * daysActive).toFixed(4));
  const txHash = `stub_w_${Date.now().toString(16)}`;

  return {
    positionId,
    amountUsdc,
    yieldEarned,
    totalReceived: amountUsdc + yieldEarned,
    txHash,
    withdrawnAt: new Date().toISOString(),
  };
}

/** Calculate current yield for a position */
export function calculateCurrentYield(
  amountUsdc: number,
  apyPercent: number,
  depositedAt: string
): { yieldEarned: number; daysActive: number; currentValue: number } {
  const msPerDay = 1000 * 60 * 60 * 24;
  const daysActive = Math.max(0, (Date.now() - new Date(depositedAt).getTime()) / msPerDay);
  const yieldEarned = (amountUsdc * apyPercent) / 100 / 365 * daysActive;
  return {
    yieldEarned: parseFloat(yieldEarned.toFixed(6)),
    daysActive: parseFloat(daysActive.toFixed(1)),
    currentValue: parseFloat((amountUsdc + yieldEarned).toFixed(6)),
  };
}
