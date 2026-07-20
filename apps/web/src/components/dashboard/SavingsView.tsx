"use client";

import { useState, useEffect, useCallback } from "react";
import { VAULT_STRATEGIES, type VaultStrategy, type VaultStrategyConfig } from "@/lib/vault/soroban-vault";
import VaultDisclosure from "@/components/dashboard/VaultDisclosure";

interface VaultPosition {
  id: string;
  amount_usdc: number;
  strategy: VaultStrategy;
  apy_percent: number;
  status: "active" | "withdrawn" | "pending";
  yieldEarned: number;
  daysActive: number;
  currentValue: number;
  tx_hash: string | null;
  created_at: string;
}

const STRATEGY_ICONS: Record<VaultStrategy, string> = { conservative: "🏦", stable: "📈" };
const INR_PER_USDC = 84.1;

export default function SavingsView() {
  const [positions, setPositions] = useState<VaultPosition[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStrategy, setSelectedStrategy] = useState<VaultStrategyConfig>(VAULT_STRATEGIES[0]);
  const [depositAmount, setDepositAmount] = useState("");
  const [depositing, setDepositing] = useState(false);
  const [depositSuccess, setDepositSuccess] = useState<string | null>(null);
  const [withdrawingId, setWithdrawingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchPositions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/vault/positions");
      const data = await res.json();
      setPositions(data.positions ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps, react-hooks/set-state-in-effect
  useEffect(() => { fetchPositions(); }, [fetchPositions]);

  const totalDepositedUsdc = positions.filter(p => p.status === "active").reduce((s, p) => s + p.amount_usdc, 0);
  const totalYieldEarned = positions.filter(p => p.status === "active").reduce((s, p) => s + p.yieldEarned, 0);
  const totalCurrentValue = positions.filter(p => p.status === "active").reduce((s, p) => s + p.currentValue, 0);
  const blendedApy = positions.filter(p => p.status === "active").length > 0
    ? positions.filter(p => p.status === "active").reduce((s, p) => s + p.apy_percent, 0) / positions.filter(p => p.status === "active").length
    : selectedStrategy.apyMin;

  async function handleDeposit() {
    const amount = parseFloat(depositAmount);
    if (!amount || amount <= 0) return;
    setDepositing(true);
    setError(null);
    setDepositSuccess(null);
    try {
      const res = await fetch("/api/vault/deposit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amountUsdc: amount, strategy: selectedStrategy.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Deposit failed");
      setDepositSuccess(`✓ Deposited $${amount} USDC to ${selectedStrategy.label} vault`);
      setDepositAmount("");
      await fetchPositions();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setDepositing(false);
    }
  }

  async function handleWithdraw(positionId: string) {
    setWithdrawingId(positionId);
    setError(null);
    try {
      const res = await fetch("/api/vault/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ positionId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Withdraw failed");
      setDepositSuccess(`✓ Withdrawn + yield of $${data.receipt?.yieldEarned?.toFixed(4)} USDC received`);
      await fetchPositions();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setWithdrawingId(null);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>

      {/* Summary bar */}
      <div
        style={{
          display: "grid", gridTemplateColumns: "repeat(3,1fr)",
          border: "1px solid var(--color-border)", borderRadius: "16px",
          overflow: "hidden", backgroundColor: "#fff",
        }}
      >
        {[
          { label: "Total deposited", value: `$${totalDepositedUsdc.toFixed(2)}`, sub: `≈ ₹${Math.round(totalDepositedUsdc * INR_PER_USDC).toLocaleString("en-IN")}`, color: "var(--color-ink-900)" },
          { label: "Yield earned", value: `+$${totalYieldEarned.toFixed(4)}`, sub: "since deposit", color: "#16A34A" },
          { label: "Blended APY", value: `${blendedApy.toFixed(1)}%`, sub: "annualised", color: "var(--color-jade)" },
          { label: "Current Value", value: `$${totalCurrentValue.toFixed(2)}`, sub: "total", color: "var(--color-ink-900)" },
        ].slice(0, 3).map((m, i) => (
          <div
            key={m.label}
            style={{
              padding: "24px", borderRight: i < 2 ? "1px solid var(--color-border)" : "none",
            }}
          >
            <p style={{ fontSize: "0.75rem", color: "var(--color-ink-500)", marginBottom: "8px" }}>{m.label}</p>
            <p style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", color: m.color, letterSpacing: "-0.02em" }}>{m.value}</p>
            <p style={{ fontSize: "0.75rem", color: "var(--color-ink-400)", marginTop: "4px" }}>{m.sub}</p>
          </div>
        ))}
      </div>

      {/* Strategy selector + deposit */}
      <div className="card" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        <div>
          <p style={{ fontWeight: 700, fontSize: "0.9375rem", color: "var(--color-ink-900)", marginBottom: "4px" }}>
            Deposit to Vault
          </p>
          <p style={{ fontSize: "0.8125rem", color: "var(--color-ink-500)" }}>
            Safe yield on surplus funds. Choose a strategy below.
          </p>
        </div>

        {/* Strategy pills */}
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          {VAULT_STRATEGIES.map((s) => (
            <button
              key={s.id}
              onClick={() => setSelectedStrategy(s)}
              style={{
                flex: "1 1 180px", padding: "14px 18px", borderRadius: "12px", cursor: "pointer",
                border: `2px solid ${selectedStrategy.id === s.id ? s.riskColor : "var(--color-border)"}`,
                backgroundColor: selectedStrategy.id === s.id ? s.riskColor + "10" : "#fff",
                fontFamily: "var(--font-body)", textAlign: "left", transition: "all 0.15s",
              }}
              aria-pressed={selectedStrategy.id === s.id}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                <span style={{ fontSize: "1.1rem" }}>{STRATEGY_ICONS[s.id]}</span>
                <span style={{ fontWeight: 700, fontSize: "0.875rem", color: "var(--color-ink-900)" }}>{s.label}</span>
                <span style={{ fontSize: "0.75rem", fontWeight: 600, color: s.riskColor, marginLeft: "auto" }}>
                  {s.apyMin}–{s.apyMax}% APY
                </span>
              </div>
              <p style={{ fontSize: "0.75rem", color: "var(--color-ink-500)", lineHeight: 1.4 }}>{s.description}</p>
            </button>
          ))}
        </div>

        {/* Disclosure */}
        <VaultDisclosure selectedStrategy={selectedStrategy} />

        {/* Amount input */}
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 200px", position: "relative" }}>
            <span style={{
              position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)",
              fontSize: "0.875rem", color: "var(--color-ink-400)", pointerEvents: "none",
            }}>$</span>
            <input
              type="number"
              className="input"
              placeholder="Amount in USDC"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              style={{ paddingLeft: "28px" }}
              min="1"
              aria-label="Deposit amount in USDC"
            />
          </div>
          <button
            className="btn btn-primary"
            onClick={handleDeposit}
            disabled={depositing || !depositAmount || parseFloat(depositAmount) <= 0}
            style={{ flexShrink: 0 }}
            aria-busy={depositing}
          >
            {depositing ? "Depositing…" : `Deposit · ${selectedStrategy.label}`}
          </button>
        </div>

        {depositAmount && parseFloat(depositAmount) > 0 && (
          <p style={{ fontSize: "0.8125rem", color: "var(--color-ink-400)", marginTop: "-10px" }}>
            Estimated monthly yield: <strong style={{ color: "var(--color-jade)" }}>
              +${((parseFloat(depositAmount) * selectedStrategy.apyMin) / 100 / 12).toFixed(2)} – 
              ${((parseFloat(depositAmount) * selectedStrategy.apyMax) / 100 / 12).toFixed(2)} USDC
            </strong>
          </p>
        )}

        {depositSuccess && (
          <div style={{ padding: "10px 14px", borderRadius: "8px", backgroundColor: "var(--color-jade-light)", border: "1px solid rgba(43,122,90,0.3)" }}>
            <p style={{ fontSize: "0.875rem", color: "var(--color-jade)", fontWeight: 600 }}>{depositSuccess}</p>
          </div>
        )}
        {error && (
          <p style={{ fontSize: "0.875rem", color: "#C0392B" }}>Error: {error}</p>
        )}
      </div>

      {/* Active positions */}
      <div>
        <p style={{ fontWeight: 700, fontSize: "0.9375rem", color: "var(--color-ink-900)", marginBottom: "14px" }}>
          Active Positions
        </p>
        {loading ? (
          <div className="card" style={{ padding: "40px", textAlign: "center" }}>
            <div style={{ width: "32px", height: "32px", border: "3px solid var(--color-border)", borderTopColor: "var(--color-jade)", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
            <p style={{ fontSize: "0.875rem", color: "var(--color-ink-400)" }}>Loading positions…</p>
          </div>
        ) : positions.filter(p => p.status === "active").length === 0 ? (
          <div className="card" style={{ textAlign: "center", padding: "40px", color: "var(--color-ink-300)" }}>
            <p style={{ fontSize: "2rem", marginBottom: "8px" }}>🏦</p>
            <p style={{ fontWeight: 600, color: "var(--color-ink-500)" }}>No active positions</p>
            <p style={{ fontSize: "0.8125rem", marginTop: "4px" }}>Deposit above to start earning yield</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {positions.filter(p => p.status === "active").map((pos) => {
              const strat = VAULT_STRATEGIES.find(s => s.id === pos.strategy) ?? VAULT_STRATEGIES[0];
              return (
                <div
                  key={pos.id}
                  className="card"
                  style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px", transition: "box-shadow 0.15s" }}
                >
                  <div style={{ display: "flex", gap: "14px", alignItems: "center" }}>
                    <div style={{
                      width: "42px", height: "42px", borderRadius: "10px", flexShrink: 0,
                      backgroundColor: strat.riskColor + "15",
                      display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem",
                    }}>
                      {STRATEGY_ICONS[pos.strategy]}
                    </div>
                    <div>
                      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                        <p style={{ fontWeight: 700, fontSize: "0.875rem", color: "var(--color-ink-900)" }}>{strat.label}</p>
                        <span style={{ fontSize: "0.7rem", padding: "2px 8px", borderRadius: "100px", backgroundColor: strat.riskColor + "20", color: strat.riskColor, fontWeight: 700 }}>
                          {pos.apy_percent.toFixed(1)}% APY
                        </span>
                      </div>
                      <p style={{ fontSize: "0.75rem", color: "var(--color-ink-400)", marginTop: "2px" }}>
                        {pos.daysActive.toFixed(0)}d active · tx: {pos.tx_hash?.slice(0, 18)}…
                      </p>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "28px", alignItems: "center", flexWrap: "wrap" }}>
                    <div style={{ textAlign: "right" }}>
                      <p style={{ fontFamily: "var(--font-display)", fontSize: "1.125rem", color: "var(--color-ink-900)" }}>
                        ${pos.currentValue.toFixed(4)}
                      </p>
                      <p style={{ fontSize: "0.75rem", color: "#16A34A", marginTop: "2px" }}>
                        +${pos.yieldEarned.toFixed(4)} earned
                      </p>
                    </div>
                    <button
                      className="btn btn-ghost"
                      onClick={() => handleWithdraw(pos.id)}
                      disabled={withdrawingId === pos.id}
                      style={{ fontSize: "0.8125rem" }}
                      aria-label={`Withdraw position ${pos.id}`}
                    >
                      {withdrawingId === pos.id ? "…" : "Withdraw"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* History: withdrawn */}
      {positions.filter(p => p.status === "withdrawn").length > 0 && (
        <div>
          <p style={{ fontWeight: 600, fontSize: "0.875rem", color: "var(--color-ink-400)", marginBottom: "10px" }}>Completed</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {positions.filter(p => p.status === "withdrawn").map((pos) => (
              <div key={pos.id} className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", opacity: 0.6, flexWrap: "wrap", gap: "8px" }}>
                <p style={{ fontSize: "0.875rem", color: "var(--color-ink-700)" }}>
                  {pos.strategy} · ${pos.amount_usdc.toFixed(2)} USDC
                </p>
                <span style={{ fontSize: "0.75rem", padding: "2px 10px", borderRadius: "100px", backgroundColor: "#F1F5F9", color: "var(--color-ink-400)" }}>Withdrawn</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Soroban badge */}
      <div style={{ padding: "14px 18px", borderRadius: "10px", border: "1px dashed var(--color-border)", display: "flex", gap: "10px", alignItems: "center" }}>
        <span style={{ fontSize: "1.1rem" }}>⭐</span>
        <div>
          <p style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--color-ink-700)" }}>Powered by Stellar · Soroban</p>
          <p style={{ fontSize: "0.75rem", color: "var(--color-ink-300)", fontFamily: "monospace" }}>CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCN3 · testnet</p>
        </div>
      </div>
    </div>
  );
}
