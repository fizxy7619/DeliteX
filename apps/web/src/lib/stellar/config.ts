/**
 * Stellar Network Configuration
 * Switches between testnet and mainnet via env var STELLAR_NETWORK.
 */
import {
  Horizon,
  Networks,
  Keypair,
  Asset,
  TransactionBuilder,
  Operation,
  Memo,
  BASE_FEE,
} from "@stellar/stellar-sdk";

// ─── Network Config ──────────────────────────────────────────
const IS_TESTNET =
  (process.env.STELLAR_NETWORK ?? "TESTNET").toUpperCase() !== "MAINNET";

export const STELLAR_NETWORK_PASSPHRASE = IS_TESTNET
  ? Networks.TESTNET
  : Networks.PUBLIC;

export const HORIZON_URL = IS_TESTNET
  ? "https://horizon-testnet.stellar.org"
  : (process.env.STELLAR_RPC_URL ?? "https://horizon.stellar.org");

export const SOROBAN_RPC_URL = IS_TESTNET
  ? "https://soroban-testnet.stellar.org"
  : (process.env.STELLAR_SOROBAN_RPC_URL ?? "https://soroban.stellar.org");

export const FRIENDBOT_URL = "https://friendbot.stellar.org";

export const IS_TESTNET_MODE = IS_TESTNET;

// ─── Horizon Client ──────────────────────────────────────────
let _server: Horizon.Server | null = null;

export function getHorizonServer(): Horizon.Server {
  if (!_server) {
    _server = new Horizon.Server(HORIZON_URL);
  }
  return _server;
}

// ─── Supported Assets ────────────────────────────────────────
export const STELLAR_ASSETS = {
  /** Circle USDC on testnet */
  USDC: new Asset(
    "USDC",
    IS_TESTNET
      ? "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5" // testnet USDC issuer
      : "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN"  // mainnet USDC (Centre)
  ),
  /** EURC on testnet */
  EURC: new Asset(
    "EURC",
    IS_TESTNET
      ? "GDHU6WRG4IEQXM5NZ4BMPKOXHW76MZM4Y2IEMFDVXBSDP6SJY4ITNPP" // testnet EURC issuer (placeholder)
      : "GDHU6WRG4IEQXM5NZ4BMPKOXHW76MZM4Y2IEMFDVXBSDP6SJY4ITNPP"  // mainnet EURC (Allbridge)
  ),
  XLM: Asset.native(),
} as const;

export type StellarAssetSymbol = keyof typeof STELLAR_ASSETS;

// ─── Re-exports for convenience ───────────────────────────────
export {
  Keypair,
  Asset,
  TransactionBuilder,
  Operation,
  Memo,
  BASE_FEE,
  Horizon,
};
