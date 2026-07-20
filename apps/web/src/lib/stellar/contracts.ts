/**
 * Soroban Smart Contract Interfaces for DeliteX
 *
 * These TypeScript interfaces describe the contract ABIs.
 * Phase 3: Generated from actual Soroban contract bindings using:
 *   `stellar contract bindings typescript --contract-id <ID> --network testnet`
 *
 * For now these are hand-authored interfaces that match the intended contract design.
 * See docs/blockchain_mapping.md for Rust pseudocode.
 */

// ─── Shared Types ─────────────────────────────────────────────

export type ContractAddress = string; // Strkey C... format
export type StellarAddress = string;  // Strkey G... format

export interface ContractError {
  code: number;
  message: string;
}

// ─── Router Contract ─────────────────────────────────────────
//
// Purpose: Receives USDC/EURC and atomically splits it according
//          to the user's AllocationRule percentages.
//
// Testnet contract ID: Set via SOROBAN_CONTRACT_ID_ROUTER env var
// Deployment: Phase 3 — see packages/contracts/router/

export interface RouterContractConfig {
  contractId: ContractAddress;
  networkPassphrase: string;
  rpcUrl: string;
}

export interface AllocationSliceOnChain {
  /** Bucket identifier as a Soroban Symbol */
  bucket: "income" | "bills" | "family" | "savings";
  /** Percentage as integer 0–100 */
  percent: number;
}

export interface RouterAllocationRule {
  user: StellarAddress;
  allocations: AllocationSliceOnChain[];
  income_source_filter: StellarAddress | null;
  is_active: boolean;
  version: number; // increments on each update, for optimistic concurrency
}

/**
 * RouterContract client interface.
 * Phase 3: Replace with generated bindings from `stellar contract bindings`.
 */
export interface IRouterContract {
  /**
   * Set or update the allocation rule for a user.
   * Must be called by the user's wallet (authorization required).
   */
  set_rule(rule: RouterAllocationRule): Promise<{ hash: string }>;

  /**
   * Get the current rule for a user.
   */
  get_rule(user: StellarAddress): Promise<RouterAllocationRule | null>;

  /**
   * Route an incoming payment according to the user's rule.
   * Called by the Stellar payment memo tag or by the AI agent.
   *
   * @param user     Destination user address
   * @param amount   Amount in stroops (1 XLM = 10_000_000 stroops)
   * @param asset    Asset symbol ("USDC" | "EURC")
   * @param source   Sender address
   */
  route_payment(params: {
    user: StellarAddress;
    amount: bigint;
    asset: string;
    source: StellarAddress;
  }): Promise<{ hash: string; splits: Array<{ bucket: string; amount: bigint }> }>;
}

// ─── Vault Contract ────────────────────────────────────────────
//
// Purpose: ERC-4626-style yield vault for USDC.
//          Accepts deposits, issues shares, generates yield.
//
// Testnet contract ID: Set via SOROBAN_CONTRACT_ID_VAULT env var
// Strategy: Phase 3 — yield sourced from Stellar DEX market making
//           or integration with external yield protocols.

export interface IVaultContract {
  /**
   * Deposit USDC into the vault.
   * @returns Number of vault shares minted
   */
  deposit(params: {
    caller: StellarAddress;
    assets: bigint; // in USDC stroops (7 decimal places)
    receiver: StellarAddress;
  }): Promise<{ hash: string; shares_minted: bigint }>;

  /**
   * Redeem vault shares for USDC.
   * @returns USDC amount returned
   */
  redeem(params: {
    caller: StellarAddress;
    shares: bigint;
    receiver: StellarAddress;
    owner: StellarAddress;
  }): Promise<{ hash: string; assets_returned: bigint }>;

  /** Get total USDC assets under management */
  total_assets(): Promise<bigint>;

  /** Convert assets to shares at current exchange rate */
  convert_to_shares(assets: bigint): Promise<bigint>;

  /** Convert shares to assets at current exchange rate */
  convert_to_assets(shares: bigint): Promise<bigint>;

  /** Estimated APY in basis points (divide by 100 for %) */
  estimated_apy(): Promise<number>;

  /** Get a specific user's share balance */
  balance_of(user: StellarAddress): Promise<bigint>;
}

// ─── Stub Implementations (Phase 2/3 bridge) ─────────────────
//
// These stubs return realistic mock responses so the frontend
// can be fully integrated before contracts are deployed.

export class RouterContractStub implements IRouterContract {
  private rules = new Map<string, RouterAllocationRule>();

  async set_rule(rule: RouterAllocationRule) {
    this.rules.set(rule.user, { ...rule, version: (this.rules.get(rule.user)?.version ?? 0) + 1 });
    return { hash: `stub_tx_${Date.now().toString(36)}` };
  }

  async get_rule(user: StellarAddress) {
    return this.rules.get(user) ?? null;
  }

  async route_payment(params: { user: StellarAddress; amount: bigint; asset: string; source: StellarAddress }) {
    const rule = this.rules.get(params.user);
    if (!rule) throw new Error("No rule set for user");
    const splits = rule.allocations.map((s) => ({
      bucket: s.bucket,
      amount: (params.amount * BigInt(s.percent)) / BigInt(100),
    }));
    return { hash: `stub_route_${Date.now().toString(36)}`, splits };
  }
}

export class VaultContractStub implements IVaultContract {
  private _totalAssets = BigInt(1158400000); // 1158.4 USDC in stroops
  private _shares = new Map<string, bigint>();

  async deposit(params: { caller: StellarAddress; assets: bigint; receiver: StellarAddress }) {
    const shares = params.assets; // 1:1 initially
    this._totalAssets += params.assets;
    this._shares.set(params.receiver, (this._shares.get(params.receiver) ?? BigInt(0)) + shares);
    return { hash: `stub_deposit_${Date.now().toString(36)}`, shares_minted: shares };
  }

  async redeem(params: { caller: StellarAddress; shares: bigint; receiver: StellarAddress; owner: StellarAddress }) {
    const assets = params.shares;
    this._totalAssets -= assets;
    const current = this._shares.get(params.owner) ?? BigInt(0);
    this._shares.set(params.owner, current - params.shares);
    return { hash: `stub_redeem_${Date.now().toString(36)}`, assets_returned: assets };
  }

  async total_assets() { return this._totalAssets; }
  async convert_to_shares(assets: bigint) { return assets; }
  async convert_to_assets(shares: bigint) { return shares; }
  async estimated_apy() { return 580; } // 5.80%
  async balance_of(user: StellarAddress) { return this._shares.get(user) ?? BigInt(0); }
}

// ─── Singleton contract instances ─────────────────────────────
// Phase 3: Replace stubs with real contract clients using:
//   import { Client } from "@stellar/stellar-sdk/contract";

export const routerContract: IRouterContract = new RouterContractStub();
export const vaultContract: IVaultContract = new VaultContractStub();
