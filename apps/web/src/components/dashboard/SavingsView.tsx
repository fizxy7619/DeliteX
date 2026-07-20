"use client";

import { useDashboardContext } from "@/hooks/DashboardContext";
import { useState } from "react";

export default function SavingsView() {
  const { vault, refreshData } = useDashboardContext();
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState("");
  const [isDepositing, setIsDepositing] = useState(false);

  const vaultValue = vault ? Number(vault.totalValueUsdc) : 0;
  const yieldEarned = vault ? Number(vault.yieldEarnedUsdc) : 0;
  const apy = vault ? vault.estimatedApyPercent : 5.25;

  const handleDeposit = async () => {
    if (!depositAmount || Number(depositAmount) <= 0) return;
    setIsDepositing(true);
    try {
      const res = await fetch("/api/vault/deposit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amountUsdc: Number(depositAmount), strategy: "conservative" })
      });
      if (!res.ok) throw new Error("Deposit failed");
      await refreshData();
      setIsDepositModalOpen(false);
      setDepositAmount("");
    } catch (e) {
      alert("Error: " + (e as Error).message);
    } finally {
      setIsDepositing(false);
    }
  };

  const handleWithdraw = async () => {
    // For simplicity, just withdraw 10 USDC
    if (vaultValue < 10) {
      alert("Not enough funds to withdraw 10 USDC!");
      return;
    }
    const positionId = vault?.positions?.[0]?.id;
    if (!positionId) return alert("No active position found.");
    
    setIsDepositing(true);
    try {
      const res = await fetch("/api/vault/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ positionId, amountUsdc: 10 })
      });
      if (!res.ok) throw new Error("Withdraw failed");
      await refreshData();
    } catch (e) {
      alert("Error: " + (e as Error).message);
    } finally {
      setIsDepositing(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "2rem", color: "var(--color-ink-900)", letterSpacing: "-0.02em" }}>
            Yield Vault
          </h2>
          <p style={{ fontSize: "0.875rem", color: "var(--color-ink-500)", marginTop: "6px" }}>
            Your savings are automatically deployed to Stellar testnet DeFi protocols.
          </p>
        </div>
        <div style={{ display: "flex", gap: "12px" }}>
          <button className="btn btn-ghost" onClick={handleWithdraw} disabled={isDepositing || vaultValue < 10} style={{ fontSize: "0.875rem", padding: "8px 16px", border: "1px solid var(--color-border)" }}>
            Withdraw $10
          </button>
          <button className="btn btn-primary" onClick={() => setIsDepositModalOpen(!isDepositModalOpen)} style={{ fontSize: "0.875rem", padding: "8px 16px" }}>
            Deposit
          </button>
        </div>
      </div>

      {isDepositModalOpen && (
        <div className="card" style={{ padding: "24px", border: "1px solid var(--color-border)" }}>
          <h3 style={{ fontSize: "1.125rem", fontWeight: 600, marginBottom: "16px" }}>Deposit USDC</h3>
          <div style={{ display: "flex", gap: "12px" }}>
            <input 
              type="number" 
              className="input" 
              placeholder="Amount to deposit" 
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              style={{ flex: 1 }}
            />
            <button className="btn btn-primary" onClick={handleDeposit} disabled={isDepositing || !depositAmount}>
              {isDepositing ? "Processing..." : "Confirm"}
            </button>
          </div>
        </div>
      )}

      {/* Hero Stats */}
      <div className="card" style={{ padding: "32px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "32px", backgroundColor: "#0F172A", color: "#fff", border: "none" }}>
        <div>
          <p style={{ fontSize: "0.875rem", color: "rgba(255,255,255,0.7)", marginBottom: "8px" }}>Total Vault Balance</p>
          <p style={{ fontFamily: "var(--font-display)", fontSize: "2.5rem", color: "#fff", lineHeight: 1 }}>
            ${vaultValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", marginTop: "12px", backgroundColor: "rgba(255,255,255,0.1)", padding: "4px 10px", borderRadius: "100px" }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#10B981" }} />
            <span style={{ fontSize: "0.75rem", fontWeight: 600 }}>Soroban Testnet</span>
          </div>
        </div>

        <div>
          <p style={{ fontSize: "0.875rem", color: "rgba(255,255,255,0.7)", marginBottom: "8px" }}>All-time Yield Earned</p>
          <p style={{ fontFamily: "var(--font-display)", fontSize: "1.75rem", color: "#10B981", lineHeight: 1 }}>
            +${yieldEarned.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>

        <div>
          <p style={{ fontSize: "0.875rem", color: "rgba(255,255,255,0.7)", marginBottom: "8px" }}>Current Blended APY</p>
          <p style={{ fontFamily: "var(--font-display)", fontSize: "1.75rem", color: "#fff", lineHeight: 1 }}>
            {apy}%
          </p>
        </div>
      </div>

      {/* Strategies */}
      <div>
        <h3 style={{ fontSize: "1.125rem", fontWeight: 600, color: "var(--color-ink-900)", marginBottom: "16px" }}>
          Active Strategies
        </h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "16px" }}>
          {/* Strategy 1 */}
          <div className="card" style={{ padding: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                <div style={{ width: "32px", height: "32px", borderRadius: "50%", backgroundColor: "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  💧
                </div>
                <p style={{ fontWeight: 600, color: "var(--color-ink-900)" }}>Blend Protocol</p>
              </div>
              <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--color-jade)" }}>5.25% APY</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.875rem", color: "var(--color-ink-500)" }}>
              <span>Supplying USDC</span>
              <span>100% Allocation</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
