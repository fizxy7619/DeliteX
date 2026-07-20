"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  getAccountBalances,
  sendPayment,
  type StellarBalance
} from "@/lib/stellar/accounts";
import ProceduralGroundBackground from "@/components/ui/ProceduralGroundBackground";

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  stellar_public_key: string;
}

interface PaymentHistoryItem {
  id: string;
  created_at: string;
  amount: string;
  currency: string;
  stellar_tx_hash: string;
  user_profiles?: {
    full_name: string;
    email: string;
  };
}

const PAYCHECK_AMOUNTS = [100, 500, 1000, 5000];

export default function AdminPage() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);

  const [masterSecret, setMasterSecret] = useState("");
  const [masterPublic, setMasterPublic] = useState("");
  const [balances, setBalances] = useState<StellarBalance[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [funding, setFunding] = useState(false);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [customSecret, setCustomSecret] = useState("");
  const [lastTx, setLastTx] = useState<{ hash: string; user: string } | null>(null);
  const [history, setHistory] = useState<PaymentHistoryItem[]>([]);
  const [selectedAmount, setSelectedAmount] = useState(1000);
  const [error, setError] = useState<string | null>(null);

  // Auth guard: must be logged in to use admin
  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login?redirectTo=/admin");
        return;
      }
      setAuthChecked(true);
    };
    checkAuth();
  }, [router]);

  const getToken = async () => {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || "";
  };

  const loadHistory = async (token: string) => {
    try {
      const res = await fetch("/api/admin/history", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const hd = await res.json();
      setHistory(hd.history || []);
    } catch {
      // ignore — history is non-critical
    }
  };

  useEffect(() => {
    if (!authChecked) return;

    const init = async () => {
      const token = await getToken();

      // Load master wallet
      fetch("/api/admin/wallet", {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(r => r.json())
        .then(async d => {
          if (d.exists) {
            setMasterSecret(d.secretKey);
            setMasterPublic(d.publicKey);
            const acc = await getAccountBalances(d.publicKey);
            if (acc) setBalances(acc.balances);
            await loadHistory(token);
          }
        })
        .catch(err => console.error("Wallet load error:", err));

      // Load users
      fetch("/api/admin/users")
        .then(r => r.json())
        .then(d => {
          if (d.users) setUsers(d.users);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    };

    init();
  }, [authChecked]);

  const handleGenerateAndFund = async () => {
    setFunding(true);
    setError(null);
    try {
      const token = await getToken();

      const res = await fetch("/api/admin/wallet", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ action: "generate" })
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();

      setMasterSecret(data.secretKey);
      setMasterPublic(data.publicKey);

      // Wait for Horizon to index the new account
      await new Promise(r => setTimeout(r, 3000));
      const acc = await getAccountBalances(data.publicKey);
      if (acc) setBalances(acc.balances);
      await loadHistory(token);
    } catch (err) {
      setError("Failed to initialize Master Wallet: " + (err as Error).message);
    } finally {
      setFunding(false);
    }
  };

  const handleRestoreSecret = async () => {
    if (!customSecret.startsWith("S")) {
      setError("Invalid secret key. Must start with S.");
      return;
    }
    setFunding(true);
    setError(null);
    try {
      const token = await getToken();

      const res = await fetch("/api/admin/wallet", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ action: "restore", secretKey: customSecret })
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();

      setMasterSecret(data.secretKey);
      setMasterPublic(data.publicKey);
      const acc = await getAccountBalances(data.publicKey);
      if (acc) setBalances(acc.balances);
      setCustomSecret("");
      await loadHistory(token);
    } catch (err) {
      setError("Invalid secret key: " + (err as Error).message);
    } finally {
      setFunding(false);
    }
  };

  const handleSendPaycheck = async (user: UserProfile) => {
    if (!masterSecret) {
      setError("Initialize Master Wallet first");
      return;
    }
    setSendingId(user.id);
    setError(null);
    try {
      const txHash = await sendPayment({
        senderSecret: masterSecret,
        destinationPublicKey: user.stellar_public_key,
        asset: "XLM",
        amount: String(selectedAmount),
        memo: "Delite Paycheck"
      });

      // Record payment in Supabase
      const res = await fetch("/api/admin/record-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          amount: String(selectedAmount),
          currency: "XLM",
          counterparty: masterPublic,
          description: `Monthly Salary - ${selectedAmount} XLM (from Admin)`,
          txHash,
          bucket: "income",
          direction: "incoming"
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to record payment");
      }

      setLastTx({ hash: txHash, user: user.full_name || user.email });

      // Refresh master wallet balance
      const acc = await getAccountBalances(masterPublic);
      if (acc) setBalances(acc.balances);

      // Refresh history
      const token = await getToken();
      await loadHistory(token);
    } catch (err) {
      console.error(err);
      setError("Payment failed: " + (err as Error).message);
    } finally {
      setSendingId(null);
    }
  };

  const handleDisconnect = async () => {
    const token = await getToken();
    await fetch("/api/admin/wallet", {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    });
    setMasterSecret("");
    setMasterPublic("");
    setBalances([]);
    setHistory([]);
    setLastTx(null);
  };

  if (!authChecked || loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#0f0d0b" }}>
        <div style={{ textAlign: "center", color: "#fff" }}>
          <div style={{ fontSize: "2rem", marginBottom: "12px" }}>⚙️</div>
          <p style={{ color: "rgba(255,255,255,0.6)" }}>Loading Admin Panel...</p>
        </div>
      </div>
    );
  }

  const xlmBalance = balances.find(b => b.asset === "XLM" || b.asset === "native");

  return (
    <div className="dashboard-theme" style={{ minHeight: "100vh", position: "relative", color: "#fff" }}>
      <ProceduralGroundBackground />
      <div style={{ position: "relative", zIndex: 1, padding: "40px 24px", maxWidth: "1100px", margin: "0 auto" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "40px", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <p style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", marginBottom: "4px" }}>
              Delite OS · Stellar Testnet
            </p>
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: "2.5rem", letterSpacing: "-0.02em" }}>
              Admin Panel
            </h1>
            <p style={{ fontSize: "0.875rem", color: "rgba(255,255,255,0.5)", marginTop: "6px" }}>
              Fund user accounts and dispatch paychecks via live Stellar Testnet transactions.
            </p>
          </div>
          <a
            href="/app"
            style={{ padding: "8px 16px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.7)", fontSize: "0.875rem", textDecoration: "none" }}
          >
            ← Back to Dashboard
          </a>
        </div>

        {/* Error Banner */}
        {error && (
          <div style={{ marginBottom: "24px", padding: "16px 20px", borderRadius: "10px", backgroundColor: "rgba(192,57,43,0.15)", border: "1px solid rgba(192,57,43,0.4)", color: "#ff8a7a" }}>
            <strong>Error:</strong> {error}
            <button onClick={() => setError(null)} style={{ float: "right", background: "none", border: "none", color: "#ff8a7a", cursor: "pointer", fontSize: "1.1rem" }}>×</button>
          </div>
        )}

        {/* Success banner */}
        {lastTx && (
          <div style={{ marginBottom: "24px", padding: "20px 24px", borderRadius: "12px", border: "1px solid rgba(43,122,90,0.5)", backgroundColor: "rgba(43,122,90,0.12)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" }}>
              <div>
                <p style={{ fontWeight: 700, color: "var(--color-jade)", marginBottom: "4px" }}>
                  ✓ Paycheck sent to {lastTx.user}
                </p>
                <p style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,0.5)", fontFamily: "monospace", wordBreak: "break-all" }}>
                  TX: {lastTx.hash}
                </p>
              </div>
              <a
                href={`https://stellar.expert/explorer/testnet/tx/${lastTx.hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-ghost"
                style={{ fontSize: "0.8125rem", padding: "8px 16px", color: "var(--color-jade)", borderColor: "rgba(43,122,90,0.3)" }}
              >
                View on Explorer ↗
              </a>
            </div>
          </div>
        )}

        {/* Two-column layout */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: "24px", alignItems: "start" }}>

          {/* LEFT: Master Wallet */}
          <div className="card" style={{ padding: "28px", backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <h2 style={{ fontSize: "1.125rem", fontWeight: 700, marginBottom: "6px", display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "1.25rem" }}>🏦</span> Master Wallet
            </h2>
            <p style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,0.4)", marginBottom: "20px" }}>
              Acts as the employer/admin account on Stellar Testnet.
            </p>

            {!masterSecret ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <button
                  className="btn btn-saffron"
                  onClick={handleGenerateAndFund}
                  disabled={funding}
                  style={{ width: "100%" }}
                >
                  {funding ? "Generating & Funding..." : "🚀 Generate & Fund (10k XLM via Friendbot)"}
                </button>

                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{ flex: 1, height: "1px", backgroundColor: "rgba(255,255,255,0.08)" }} />
                  <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.3)" }}>OR</span>
                  <div style={{ flex: 1, height: "1px", backgroundColor: "rgba(255,255,255,0.08)" }} />
                </div>

                <div style={{ display: "flex", gap: "8px" }}>
                  <input
                    type="text"
                    placeholder="Paste existing secret key (S...)"
                    value={customSecret}
                    onChange={(e) => setCustomSecret(e.target.value)}
                    style={{
                      flex: 1,
                      backgroundColor: "rgba(255,255,255,0.05)",
                      color: "#fff",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "8px",
                      padding: "10px 14px",
                      fontSize: "0.875rem",
                      fontFamily: "monospace",
                      outline: "none"
                    }}
                  />
                  <button
                    className="btn btn-ghost"
                    onClick={handleRestoreSecret}
                    disabled={!customSecret.startsWith("S") || funding}
                    style={{ borderColor: "rgba(255,255,255,0.15)", color: "#fff", padding: "10px 16px" }}
                  >
                    Restore
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div style={{ padding: "12px 16px", borderRadius: "8px", backgroundColor: "rgba(43,122,90,0.12)", border: "1px solid rgba(43,122,90,0.3)", marginBottom: "16px" }}>
                  <p style={{ fontSize: "0.6875rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-jade)", marginBottom: "4px" }}>
                    Connected
                  </p>
                  <p style={{ fontSize: "0.75rem", fontFamily: "monospace", wordBreak: "break-all", color: "rgba(255,255,255,0.7)" }}>
                    {masterPublic}
                  </p>
                  <a
                    href={`https://stellar.expert/explorer/testnet/account/${masterPublic}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: "0.7rem", color: "var(--color-jade)", textDecoration: "underline", marginTop: "6px", display: "inline-block" }}
                  >
                    View on Stellar Expert ↗
                  </a>
                </div>

                {/* Balances */}
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "16px" }}>
                  {balances.length > 0 ? balances.map(b => (
                    <div key={b.asset} style={{ padding: "12px 16px", borderRadius: "8px", backgroundColor: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", flex: "1", minWidth: "100px" }}>
                      <p style={{ fontSize: "0.6875rem", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)" }}>
                        {b.asset === "native" ? "XLM" : b.asset}
                      </p>
                      <p style={{ fontFamily: "var(--font-display)", fontSize: "1.375rem", marginTop: "2px" }}>
                        {parseFloat(b.balance).toLocaleString("en-US", { maximumFractionDigits: 2 })}
                      </p>
                    </div>
                  )) : (
                    <div style={{ padding: "12px 16px", borderRadius: "8px", backgroundColor: "rgba(255,255,255,0.03)", color: "rgba(255,255,255,0.3)", fontSize: "0.875rem" }}>
                      Loading balances...
                    </div>
                  )}
                </div>

                {/* Paycheck amount selector */}
                <div style={{ marginBottom: "16px" }}>
                  <p style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)", marginBottom: "8px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Paycheck Amount (XLM)
                  </p>
                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                    {PAYCHECK_AMOUNTS.map(amt => (
                      <button
                        key={amt}
                        onClick={() => setSelectedAmount(amt)}
                        style={{
                          padding: "6px 14px",
                          borderRadius: "6px",
                          border: `1px solid ${selectedAmount === amt ? "var(--color-saffron)" : "rgba(255,255,255,0.12)"}`,
                          backgroundColor: selectedAmount === amt ? "rgba(232,135,42,0.15)" : "transparent",
                          color: selectedAmount === amt ? "var(--color-saffron)" : "rgba(255,255,255,0.5)",
                          fontSize: "0.8125rem",
                          fontWeight: selectedAmount === amt ? 700 : 400,
                          cursor: "pointer",
                          fontFamily: "var(--font-body)"
                        }}
                      >
                        {amt.toLocaleString()}
                      </button>
                    ))}
                  </div>
                  {xlmBalance && parseFloat(xlmBalance.balance) < selectedAmount && (
                    <p style={{ fontSize: "0.75rem", color: "#ff8a7a", marginTop: "6px" }}>
                      ⚠ Insufficient balance ({parseFloat(xlmBalance.balance).toLocaleString()} XLM available)
                    </p>
                  )}
                </div>

                <button
                  className="btn btn-ghost"
                  onClick={handleDisconnect}
                  style={{ fontSize: "0.8125rem", padding: "8px 14px", borderColor: "rgba(192,57,43,0.3)", color: "#ff8a7a", width: "100%" }}
                >
                  Disconnect Wallet
                </button>
              </div>
            )}
          </div>

          {/* RIGHT: Users + History */}
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>

            {/* Registered Users */}
            <div className="card" style={{ padding: "28px", backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <h2 style={{ fontSize: "1.125rem", fontWeight: 700, marginBottom: "6px", display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "1.25rem" }}>👥</span> Registered Users
                <span style={{ fontSize: "0.75rem", padding: "2px 8px", borderRadius: "100px", backgroundColor: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)", fontWeight: 400, marginLeft: "auto" }}>
                  {users.length} connected
                </span>
              </h2>
              <p style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,0.4)", marginBottom: "20px" }}>
                Users who have linked a Stellar Testnet wallet.
              </p>

              {users.length === 0 ? (
                <div style={{ padding: "32px", textAlign: "center", borderRadius: "10px", border: "1px dashed rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.3)", fontSize: "0.875rem" }}>
                  No users have connected a Stellar wallet yet.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {users.map(user => (
                    <div
                      key={user.id}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "14px 18px",
                        backgroundColor: "rgba(255,255,255,0.03)",
                        border: "1px solid rgba(255,255,255,0.07)",
                        borderRadius: "10px",
                        flexWrap: "wrap",
                        gap: "12px"
                      }}
                    >
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontWeight: 600, fontSize: "0.9375rem", marginBottom: "2px" }}>
                          {user.full_name || "—"}
                        </p>
                        <p style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)", marginBottom: "2px" }}>
                          {user.email}
                        </p>
                        <p style={{ fontSize: "0.7rem", fontFamily: "monospace", color: "rgba(255,255,255,0.25)", wordBreak: "break-all" }}>
                          {user.stellar_public_key}
                        </p>
                      </div>
                      <button
                        className="btn btn-saffron"
                        onClick={() => handleSendPaycheck(user)}
                        disabled={sendingId === user.id || !masterSecret}
                        style={{ flexShrink: 0, fontSize: "0.8125rem", padding: "8px 16px" }}
                      >
                        {sendingId === user.id
                          ? "Sending..."
                          : `💸 Send ${selectedAmount.toLocaleString()} XLM`}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Payment History */}
            {masterSecret && (
              <div className="card" style={{ padding: "28px", backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <h2 style={{ fontSize: "1.125rem", fontWeight: 700, marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "1.25rem" }}>📋</span> Payment History
                </h2>

                {history.length === 0 ? (
                  <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.875rem", textAlign: "center", padding: "24px 0" }}>
                    No payments sent yet. Fund a user above to see transactions here.
                  </p>
                ) : (
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", textAlign: "left", borderCollapse: "collapse", fontSize: "0.8125rem" }}>
                      <thead>
                        <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                          {["Date", "Recipient", "Amount", "Transaction"].map(h => (
                            <th key={h} style={{ padding: "10px 12px", color: "rgba(255,255,255,0.3)", fontWeight: 600, textTransform: "uppercase", fontSize: "0.6875rem", letterSpacing: "0.05em" }}>
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {history.map(item => (
                          <tr key={item.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                            <td style={{ padding: "12px" }}>{new Date(item.created_at).toLocaleString()}</td>
                            <td style={{ padding: "12px" }}>
                              {item.user_profiles?.full_name || item.user_profiles?.email || "Unknown"}
                            </td>
                            <td style={{ padding: "12px", color: "var(--color-jade)", fontWeight: 700 }}>
                              {parseFloat(item.amount).toLocaleString()} {item.currency}
                            </td>
                            <td style={{ padding: "12px" }}>
                              {item.stellar_tx_hash ? (
                                <a
                                  href={`https://stellar.expert/explorer/testnet/tx/${item.stellar_tx_hash}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{ color: "var(--color-saffron)", textDecoration: "underline", fontFamily: "monospace" }}
                                >
                                  {item.stellar_tx_hash.slice(0, 10)}...
                                </a>
                              ) : (
                                <span style={{ color: "rgba(255,255,255,0.2)" }}>—</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <style>{`
          @media (max-width: 900px) {
            .admin-grid { grid-template-columns: 1fr !important; }
          }
        `}</style>
      </div>
    </div>
  );
}
