/**
 * Stellar Payment Stream Listener
 *
 * Listens to Horizon's SSE payment stream for a given account.
 * Converts raw Horizon events into our PaymentEvent domain type.
 *
 * Usage (in API route or server action):
 *   const stream = watchPayments(publicKey, onPayment);
 *   // Later: stream.close()
 *
 * Phase 3 Production:
 * - Replace polling with a persistent Supabase Edge Function that
 *   subscribes to the Horizon stream and writes PaymentEvents via
 *   the service-role key.
 * - Use Supabase Realtime on the client to receive updates.
 */
import type { PaymentEvent } from "@/types/domain";
import {
  getHorizonServer,
  IS_TESTNET_MODE,
} from "./config";
import type { Horizon } from "@stellar/stellar-sdk";

export type PaymentCallback = (event: Partial<PaymentEvent>) => void;

/** Convert a Horizon payment record to our PaymentEvent shape */
function horizonPaymentToEvent(
  record: Horizon.ServerApi.PaymentOperationRecord,
  ownerPublicKey: string
): Partial<PaymentEvent> {
  const isIncoming = record.to === ownerPublicKey;
  const amount = parseFloat(record.amount ?? "0");

  // Determine asset
  let currency: PaymentEvent["currency"] = "XLM" as PaymentEvent["currency"];
  if ("asset_code" in record) {
    currency = (record as Horizon.ServerApi.PaymentOperationRecord & { asset_code: string })
      .asset_code as PaymentEvent["currency"];
  }

  return {
    direction: isIncoming ? "incoming" : "outgoing",
    bucket: isIncoming ? "income" : "bills",
    status: "completed",
    amount,
    currency,
    counterparty: isIncoming ? record.from : record.to,
    description: `Stellar payment${isIncoming ? " received" : " sent"}`,
    rail: "stellar",
    stellarTxHash: record.transaction_hash,
    settledAt: record.created_at,
    createdAt: record.created_at,
  };
}

/**
 * Watch a Stellar account for incoming/outgoing payments.
 * Returns a cleanup function.
 *
 * NOTE: This opens a long-lived SSE connection.
 * In Next.js App Router, call this inside a Server-Sent Events route or
 * a background process, not inside a React component directly.
 */
export function watchPayments(
  publicKey: string,
  onPayment: PaymentCallback,
  onError?: (err: Error) => void
): { close: () => void } {
  const server = getHorizonServer();

  const stream = server
    .payments()
    .forAccount(publicKey)
    .cursor("now")
    .stream({
      onmessage: (record) => {
        try {
          if (record.type === "payment") {
            const event = horizonPaymentToEvent(
              record as Horizon.ServerApi.PaymentOperationRecord,
              publicKey
            );
            onPayment(event);
          }
        } catch (err) {
          onError?.(err as Error);
        }
      },
      onerror: (err) => {
        onError?.(new Error(String(err)));
      },
    });

  return { close: stream };
}

/**
 * Fetch recent payments for an account (REST, not streaming).
 * Good for initial load / page refresh.
 */
export async function getRecentPayments(
  publicKey: string,
  limit = 20
): Promise<Partial<PaymentEvent>[]> {
  const server = getHorizonServer();

  try {
    const records = await server
      .payments()
      .forAccount(publicKey)
      .order("desc")
      .limit(limit)
      .call();

    return records.records
      .filter((r) => r.type === "payment")
      .map((r) =>
        horizonPaymentToEvent(
          r as Horizon.ServerApi.PaymentOperationRecord,
          publicKey
        )
      );
  } catch {
    // Account not found (not funded yet)
    return [];
  }
}

/** Check if an asset trustline exists for the account */
export async function hasTrustline(
  publicKey: string,
  assetCode: string
): Promise<boolean> {
  const server = getHorizonServer();
  try {
    const account = await server.loadAccount(publicKey);
    return account.balances.some(
      (b) =>
        b.asset_type !== "native" &&
        (b as { asset_code: string }).asset_code === assetCode
    );
  } catch {
    return false;
  }
}

export { IS_TESTNET_MODE };
