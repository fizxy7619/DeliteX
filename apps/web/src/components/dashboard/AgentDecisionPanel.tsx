"use client";

import { useState } from "react";
import type { AgentProposal } from "@/lib/ai/agent-engine";
import type { ExecutionResult } from "@/lib/ai/executor";
import { TransactionBuilder, rpc } from "@stellar/stellar-sdk";
import {
  StellarWalletsKit,
  Networks,
} from "@creit.tech/stellar-wallets-kit";
import { FreighterModule } from "@creit.tech/stellar-wallets-kit/modules/freighter";
import { xBullModule } from "@creit.tech/stellar-wallets-kit/modules/xbull";
import { AlbedoModule } from "@creit.tech/stellar-wallets-kit/modules/albedo";

const BUCKET_ICONS: Record<string, string> = {
  bills: "📄", family: "👨‍👩‍👧", savings: "🏦", income: "💼",
};
const BUCKET_COLORS: Record<string, { bg: string; fg: string }> = {
  bills:   { bg: "#FFF7ED", fg: "#E8872A" },
  family:  { bg: "var(--color-jade-light)", fg: "var(--color-jade)" },
  savings: { bg: "#EEF2FF", fg: "#4F46E5" },
  income:  { bg: "#F1F5F9", fg: "#64748B" },
};

interface AgentDecisionPanelProps {
  decisionId: string;
  proposal: AgentProposal;
  onExecuted: (result: ExecutionResult) => void;
  onDismiss: () => void;
}

export default function AgentDecisionPanel({ decisionId, proposal, onExecuted, onDismiss }: AgentDecisionPanelProps) {
  const [executing, setExecuting] = useState(false);
  const [result, setResult] = useState<ExecutionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleApprove() {
    setExecuting(true);
    setError(null);
    try {
      // 1. Ask backend to build the XDR
      const xdrRes = await fetch("/api/ai/build-xdr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decisionId }),
      });
      if (!xdrRes.ok) throw new Error(await xdrRes.text());
      const { xdr } = await xdrRes.json();

      let txHash = "";

      // 2. Ask user to sign via StellarWalletsKit
      try {
        // Ensure kit is initialized in case of page refresh
        try {
          const storedWallet = localStorage.getItem("delite_wallet_id") || "freighter";
          StellarWalletsKit.init({
            network: Networks.TESTNET,
            selectedWalletId: storedWallet, // Use the dynamically saved wallet ID from login
            modules: [new FreighterModule(), new xBullModule(), new AlbedoModule()],
          });
        } catch (e) {
          // ignore if already initialized
        }

        const signResult = await StellarWalletsKit.signTransaction(xdr, { 
          networkPassphrase: "Test SDF Network ; September 2015" 
        });

        // 3. Submit to Stellar testnet via Soroban RPC
        const rpcServer = new rpc.Server("https://soroban-testnet.stellar.org");
        const tx = TransactionBuilder.fromXDR(signResult.signedTxXdr, "Test SDF Network ; September 2015");
        const submitRes = await rpcServer.sendTransaction(tx as any);
        
        if (submitRes.status === "ERROR") {
          throw new Error("Soroban submission failed");
        }
        
        txHash = submitRes.hash;

        // Poll for success
        if (submitRes.status === "PENDING") {
          let isSuccess = false;
          for (let i = 0; i < 15; i++) {
            await new Promise(resolve => setTimeout(resolve, 1500));
            const txStatus = await rpcServer.getTransaction(txHash);
            if (txStatus.status === "SUCCESS") {
              isSuccess = true;
              break;
            } else if (txStatus.status === "FAILED") {
              throw new Error("Soroban execution failed on-chain");
            }
          }
          if (!isSuccess) {
            throw new Error("Transaction polling timed out");
          }
        }
      } catch (err) {
        console.warn("Wallet signing failed or cancelled:", err);
        throw new Error("Wallet signing failed: " + ((err as Error).message || "Unknown error"));
      }

      // 4. Mark executed in DB
      const res = await fetch("/api/ai/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decisionId, txHash }),
      });
      const data: ExecutionResult = await res.json();
      if (!res.ok && res.status !== 207) throw new Error("Database update failed");
      
      setResult(data);
      onExecuted(data);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setExecuting(false);
    }
  }

  return (
    <div className="card" style={{ border: "1px solid rgba(232,135,42,0.35)", backgroundColor: "#FFFBF5" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px", flexWrap: "wrap", gap: "10px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <span style={{ fontSize: "1.1rem" }}>✦</span>
            <p style={{ fontWeight: 700, fontSize: "0.9375rem", color: "#1E293B" }}>Agent Proposal</p>
            <span style={{ fontSize: "0.7rem", padding: "2px 8px", borderRadius: "100px", backgroundColor: "#FEF3C7", color: "#92400E", fontWeight: 700 }}>PENDING APPROVAL</span>
          </div>
          <p style={{ fontSize: "0.8125rem", color: "#64748B" }}>
            Incoming: <strong>${proposal.totalUsdc.toFixed(2)} USDC</strong> ≈ <strong>₹{proposal.totalInr.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</strong> at ₹{proposal.fxRate}/USDC
          </p>
        </div>
        {!result && (
          <button onClick={onDismiss} style={{ background: "none", border: "none", cursor: "pointer", color: "#94A3B8", fontSize: "1.2rem", lineHeight: 1, padding: "2px" }}>
            ×
          </button>
        )}
      </div>

      {/* Line items */}
      <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "20px" }}>
        {proposal.items.map((item) => {
          const c = BUCKET_COLORS[item.bucket] ?? { bg: "#F8F7F4", fg: "#64748B" };
          const executedItem = result?.items.find((r) => r.bucket === item.bucket);
          return (
            <div key={item.bucket} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 14px", borderRadius: "10px", backgroundColor: c.bg, flexWrap: "wrap", gap: "8px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontSize: "1.1rem" }}>{BUCKET_ICONS[item.bucket]}</span>
                <div>
                  <p style={{ fontWeight: 600, fontSize: "0.875rem", color: "#1E293B" }}>{item.label}</p>
                  <p style={{ fontSize: "0.75rem", color: "#64748B", marginTop: "1px" }}>{item.description}</p>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <p style={{ fontFamily: "var(--font-display)", fontSize: "1rem", color: c.fg, fontWeight: 600 }}>
                  ₹{item.amountInr.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                </p>
                <p style={{ fontSize: "0.75rem", color: "#94A3B8" }}>${item.amountUsdc} · {item.percent}%</p>
                {executedItem && (
                  <p style={{ fontSize: "0.7rem", marginTop: "2px", color: executedItem.status === "executed" ? "var(--color-jade)" : "#C0392B", fontWeight: 600 }}>
                    {executedItem.status === "executed" ? (
                      (executedItem as { txHash?: string; explorerUrl?: string }).explorerUrl ? (
                        <a
                          href={(executedItem as { txHash?: string; explorerUrl?: string }).explorerUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: "var(--color-jade)", textDecoration: "underline" }}
                        >
                          ✓ View on Explorer ↗
                        </a>
                      ) : `✓ ${executedItem.txHash?.slice(0, 16)}…`
                    ) : `✗ ${executedItem.error || "Failed"}`}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Actions or result */}
      {result ? (
        <div style={{ padding: "12px 14px", borderRadius: "8px", backgroundColor: result.success ? "var(--color-jade-light)" : "#FEF2F2", border: `1px solid ${result.success ? "rgba(43,122,90,0.3)" : "rgba(192,57,43,0.3)"}` }}>
          <p style={{ fontSize: "0.875rem", fontWeight: 600, color: result.success ? "var(--color-jade)" : "#C0392B" }}>
            {result.success ? "✓ All payments executed successfully" : "⚠ Some payments failed — check Agent History"}
          </p>
          <p style={{ fontSize: "0.75rem", color: "var(--color-ink-500)", marginTop: "2px" }}>
            Executed at {new Date(result.executedAt).toLocaleTimeString("en-IN")}
          </p>
        </div>
      ) : (
        <>
          {error && (
            <p style={{ fontSize: "0.8125rem", color: "#C0392B", marginBottom: "12px" }}>Error: {error}</p>
          )}
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <button onClick={handleApprove} disabled={executing} className="btn btn-saffron" style={{ flex: 1, minWidth: "140px" }}>
              {executing ? "Executing…" : "✓ Approve & Execute"}
            </button>
            <button onClick={onDismiss} className="btn btn-ghost" style={{ flexShrink: 0 }}>
              Dismiss
            </button>
          </div>
          <p style={{ fontSize: "0.75rem", color: "var(--color-ink-300)", marginTop: "10px" }}>
            Stellar Testnet · All transactions verifiable on stellar.expert ↗
          </p>
        </>
      )}
    </div>
  );
}
