/**
 * Stellar Account Service
 *
 * Manages user Stellar accounts:
 * - Generating keypairs
 * - Funding on testnet via Friendbot
 * - Establishing USDC/EURC trustlines
 * - Fetching balances
 *
 * Phase 3 Production Notes:
 * - Keypairs should be generated client-side in Freighter/Albedo
 * - Server NEVER stores private keys in production
 * - For custodial mode: encrypt secret key with user's password-derived key
 */
import {
  Keypair,
  TransactionBuilder,
  Operation,
  BASE_FEE,
  Horizon,
  getHorizonServer,
  STELLAR_NETWORK_PASSPHRASE,
  STELLAR_ASSETS,
  FRIENDBOT_URL,
  HORIZON_URL,
  IS_TESTNET_MODE,
} from "./config";

export interface StellarBalance {
  asset: string;
  balance: string;
  issuer?: string;
}

export interface StellarAccountInfo {
  publicKey: string;
  sequence: string;
  balances: StellarBalance[];
  isTestnet: boolean;
  horizonUrl: string;
  explorerUrl: string;
}

// ─── Create new keypair (testnet only / non-custodial helper) ─
export function generateKeypair(): { publicKey: string; secretKey: string } {
  const kp = Keypair.random();
  return {
    publicKey: kp.publicKey(),
    secretKey: kp.secret(),
  };
}

// ─── Fund account on testnet via Friendbot ────────────────────
export async function fundTestnetAccount(publicKey: string): Promise<boolean> {
  if (!IS_TESTNET_MODE) {
    throw new Error("Friendbot is only available on testnet.");
  }

  const res = await fetch(`${FRIENDBOT_URL}?addr=${encodeURIComponent(publicKey)}`);
  return res.ok;
}

// ─── Establish USDC and EURC trustlines ───────────────────────
export async function establishTrustlines(
  secretKey: string,
  assets: (keyof typeof STELLAR_ASSETS)[] = ["USDC", "EURC"]
): Promise<string> {
  const server = getHorizonServer();
  const keypair = Keypair.fromSecret(secretKey);
  const account = await server.loadAccount(keypair.publicKey());

  const txBuilder = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: STELLAR_NETWORK_PASSPHRASE,
  });

  for (const symbol of assets) {
    if (symbol === "XLM") continue; // XLM needs no trustline
    txBuilder.addOperation(
      Operation.changeTrust({
        asset: STELLAR_ASSETS[symbol],
        limit: "100000", // max hold limit per user
      })
    );
  }

  const tx = txBuilder.setTimeout(30).build();
  tx.sign(keypair);

  const result = await server.submitTransaction(tx);
  return (result as Horizon.HorizonApi.SubmitTransactionResponse).hash;
}

// ─── Fetch account balances ───────────────────────────────────
export async function getAccountBalances(
  publicKey: string
): Promise<StellarAccountInfo | null> {
  const server = getHorizonServer();

  try {
    const account = await server.loadAccount(publicKey);
    const balances: StellarBalance[] = account.balances.map((b) => {
      if (b.asset_type === "native") {
        return { asset: "XLM", balance: b.balance };
      }
      const bal = b as Horizon.HorizonApi.BalanceLine & { asset_code: string; asset_issuer: string };
      return {
        asset: bal.asset_code,
        balance: bal.balance,
        issuer: bal.asset_issuer,
      };
    });

    const explorerBase = IS_TESTNET_MODE
      ? "https://stellar.expert/explorer/testnet/account"
      : "https://stellar.expert/explorer/public/account";

    return {
      publicKey,
      sequence: account.sequenceNumber(),
      balances,
      isTestnet: IS_TESTNET_MODE,
      horizonUrl: HORIZON_URL,
      explorerUrl: `${explorerBase}/${publicKey}`,
    };
  } catch (err: unknown) {
    // Account not funded yet — Horizon returns 404
    const horizonErr = err as { response?: { status?: number } };
    if (horizonErr?.response?.status === 404) {
      return null;
    }
    throw err;
  }
}

// ─── Send a Stellar payment (testnet) ────────────────────────
export async function sendPayment({
  senderSecret,
  destinationPublicKey,
  asset,
  amount,
  memo,
}: {
  senderSecret: string;
  destinationPublicKey: string;
  asset: keyof typeof STELLAR_ASSETS;
  amount: string;
  memo?: string;
}): Promise<string> {
  const server = getHorizonServer();
  const senderKeypair = Keypair.fromSecret(senderSecret);
  const senderAccount = await server.loadAccount(senderKeypair.publicKey());

  const txBuilder = new TransactionBuilder(senderAccount, {
    fee: BASE_FEE,
    networkPassphrase: STELLAR_NETWORK_PASSPHRASE,
  });

  txBuilder.addOperation(
    Operation.payment({
      destination: destinationPublicKey,
      asset: STELLAR_ASSETS[asset],
      amount,
    })
  );

  if (memo) {
    txBuilder.addMemo({ memoType: "MemoText", value: memo } as never);
  }

  const tx = txBuilder.setTimeout(30).build();
  tx.sign(senderKeypair);

  const result = await server.submitTransaction(tx);
  return (result as Horizon.HorizonApi.SubmitTransactionResponse).hash;
}
