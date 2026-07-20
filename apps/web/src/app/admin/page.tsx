"use client";

import { useEffect, useState } from "react";
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
  tx_hash: string;
  user_profiles?: {
    full_name: string;
    email: string;
  };
}

export default function AdminPage() {
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

  useEffect(() => {
    // Fetch master wallet from API
    fetch("/api/admin/wallet", {
      headers: { Authorization: `Bearer ${localStorage.getItem("supabase.auth.token") || ""}` }
    })
      .then(r => r.json())
      .then(d => {
        if (d.exists) {
          setMasterSecret(d.secretKey);
          setMasterPublic(d.publicKey);
          getAccountBalances(d.publicKey).then(acc => {
            if (acc) setBalances(acc.balances);
          });
          // Fetch history
          fetch("/api/admin/history", {
            headers: { Authorization: `Bearer ${localStorage.getItem("supabase.auth.token") || ""}` }
          }).then(r => r.json()).then(hd => setHistory(hd.history || []));
        }
      });

    fetch("/api/admin/users")
      .then(r => r.json())
      .then(d => {
        if (d.users) setUsers(d.users);
        setLoading(false);
      });
  }, []);

  const handleGenerateAndFund = async () => {
    setFunding(true);
    try {
      const res = await fetch("/api/admin/wallet", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("supabase.auth.token") || ""}`
        },
        body: JSON.stringify({ action: "generate" })
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      
      setMasterSecret(data.secretKey);
      setMasterPublic(data.publicKey);
      
      // Wait a moment for Horizon to index
      await new Promise(r => setTimeout(r, 2000));
      const acc = await getAccountBalances(data.publicKey);
      if (acc) setBalances(acc.balances);

      fetch("/api/admin/history", {
        headers: { Authorization: `Bearer ${localStorage.getItem("supabase.auth.token") || ""}` }
      }).then(r => r.json()).then(hd => setHistory(hd.history || []));

    } catch (err) {
      alert("Failed to initialize Master Wallet: " + (err as Error).message);
    } finally {
      setFunding(false);
    }
  };

  const handleRestoreSecret = async () => {
    if (!customSecret.startsWith("S")) return alert("Invalid secret key. Must start with S.");
    setFunding(true);
    try {
      const res = await fetch("/api/admin/wallet", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("supabase.auth.token") || ""}`
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

      fetch("/api/admin/history", {
        headers: { Authorization: `Bearer ${localStorage.getItem("supabase.auth.token") || ""}` }
      }).then(r => r.json()).then(hd => setHistory(hd.history || []));

    } catch (err) {
      alert("Invalid secret key: " + (err as Error).message);
    } finally {
      setFunding(false);
    }
  };

  const handleSendPaycheck = async (user: UserProfile) => {
    if (!masterSecret) return alert("Initialize Master Wallet first");
    setSendingId(user.id);
    try {
      // Send 1000 XLM
      const txHash = await sendPayment({
        senderSecret: masterSecret,
        destinationPublicKey: user.stellar_public_key,
        asset: "XLM",
        amount: "1000",
        memo: "Admin Paycheck"
      });

      // Record in Supabase via admin API
      const res = await fetch("/api/admin/record-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          amount: "1000",
          currency: "XLM",
          counterparty: masterPublic,
          description: "Monthly Salary (from Admin)",
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
      
      // Refresh Master Wallet Balance
      const acc = await getAccountBalances(masterPublic);
      if (acc) setBalances(acc.balances);

      // Refresh history
      fetch("/api/admin/history", {
        headers: { Authorization: `Bearer ${localStorage.getItem("supabase.auth.token") || ""}` }
      }).then(r => r.json()).then(hd => setHistory(hd.history || []));

    } catch (err) {
      console.error(err);
      alert("Payment failed: " + (err as Error).message);
    } finally {
      setSendingId(null);
    }
  };

  if (loading) return <div style={{ padding: "40px", color: "#fff" }}>Loading Admin Panel...</div>;

  return (
    <div className="dashboard-theme" style={{ minHeight: "100vh", position: "relative", color: "#fff" }}>
      <ProceduralGroundBackground />
      <div style={{ position: "relative", zIndex: 1, padding: "40px", maxWidth: "1000px", margin: "0 auto" }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "2.5rem", marginBottom: "32px" }}>
          Admin Panel
        </h1>

        <div className="card" style={{ marginBottom: "32px", padding: "32px" }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "16px" }}>Master Wallet</h2>
          {!masterSecret ? (
            <div>
              <p style={{ color: "var(--color-ink-300)", marginBottom: "16px" }}>
                No Master Wallet found. Generate one to act as the Employer/Admin, or restore an existing one.
              </p>
              <div style={{ display: "flex", gap: "12px", marginBottom: "16px" }}>
                <button 
                  className="btn btn-primary" 
                  onClick={handleGenerateAndFund}
                  disabled={funding}
                >
                  {funding ? "Generating & Funding..." : "Generate & Fund with 10k XLM"}
                </button>
              </div>
              <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                <input 
                  type="text" 
                  className="input" 
                  placeholder="Or paste an existing secret key starting with S..."
                  value={customSecret}
                  onChange={(e) => setCustomSecret(e.target.value)}
                  style={{ flex: 1, backgroundColor: "rgba(255,255,255,0.05)", color: "#fff", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", padding: "10px 16px" }}
                />
                <button 
                  className="btn btn-ghost" 
                  onClick={handleRestoreSecret}
                  disabled={!customSecret.startsWith("S")}
                  style={{ border: "1px solid rgba(255,255,255,0.2)" }}
                >
                  Restore
                </button>
              </div>
            </div>
          ) : (
            <div>
              <p style={{ fontSize: "0.875rem", color: "var(--color-ink-300)", wordBreak: "break-all", marginBottom: "16px" }}>
                <strong>Public Key:</strong> {masterPublic}
              </p>
              <div style={{ display: "flex", gap: "16px", marginBottom: "16px" }}>
                {balances.map(b => (
                  <div key={b.asset} style={{ backgroundColor: "rgba(255,255,255,0.05)", padding: "12px 20px", borderRadius: "8px" }}>
                    <p style={{ fontSize: "0.75rem", color: "var(--color-ink-500)", textTransform: "uppercase" }}>{b.asset === "native" ? "XLM" : b.asset}</p>
                    <p style={{ fontSize: "1.5rem", fontWeight: 600 }}>{parseFloat(b.balance).toLocaleString("en-US")}</p>
                  </div>
                ))}
              </div>
              <button 
                className="btn btn-ghost" 
                onClick={async () => {
                  await fetch("/api/admin/wallet", {
                    method: "DELETE",
                    headers: { Authorization: `Bearer ${localStorage.getItem("supabase.auth.token") || ""}` }
                  });
                  setMasterSecret("");
                  setMasterPublic("");
                  setBalances([]);
                  setHistory([]);
                }}
                style={{ fontSize: "0.875rem", padding: "6px 12px", border: "1px solid rgba(255,0,0,0.3)", color: "#ff6b6b" }}
              >
                Disconnect Wallet
              </button>
            </div>
          )}
        </div>

        {lastTx && (
          <div className="card" style={{ marginBottom: "32px", padding: "20px", border: "1px solid var(--color-jade)", backgroundColor: "var(--color-jade-light)" }}>
            <h3 style={{ color: "var(--color-jade)", fontWeight: 600, marginBottom: "8px" }}>✓ Payment Sent to {lastTx.user}</h3>
            <p style={{ fontSize: "0.875rem", color: "var(--color-jade)", marginBottom: "12px" }}>The transaction was successfully submitted to the Stellar Testnet.</p>
            <a 
              href={`https://stellar.expert/explorer/testnet/tx/${lastTx.hash}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="btn btn-primary"
              style={{ display: "inline-block", backgroundColor: "var(--color-jade)" }}
            >
              View on Stellar Expert ↗
            </a>
          </div>
        )}

        <div className="card" style={{ padding: "32px", marginBottom: "32px" }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "16px" }}>Registered Users</h2>
          {users.length === 0 ? (
            <p style={{ color: "var(--color-ink-500)" }}>No users have connected a Stellar Wallet yet.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {users.map(user => (
                <div key={user.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px", backgroundColor: "rgba(255,255,255,0.02)", border: "1px solid var(--color-border)", borderRadius: "8px" }}>
                  <div>
                    <p style={{ fontWeight: 600 }}>{user.full_name || user.email}</p>
                    <p style={{ fontSize: "0.75rem", color: "var(--color-ink-500)", marginTop: "4px" }}>{user.stellar_public_key}</p>
                  </div>
                  <button
                    className="btn btn-saffron"
                    onClick={() => handleSendPaycheck(user)}
                    disabled={sendingId === user.id || !masterSecret}
                  >
                    {sendingId === user.id ? "Sending..." : "Send Paycheck (1,000 XLM)"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* History Section */}
        {masterSecret && (
          <div className="card" style={{ padding: "32px" }}>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "16px" }}>Admin Payment History</h2>
            {history.length === 0 ? (
              <p style={{ color: "var(--color-ink-500)" }}>No payments sent from this wallet yet.</p>
            ) : (
              <table style={{ width: "100%", textAlign: "left", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                    <th style={{ padding: "12px", color: "var(--color-ink-300)", fontWeight: 500 }}>Date</th>
                    <th style={{ padding: "12px", color: "var(--color-ink-300)", fontWeight: 500 }}>Recipient</th>
                    <th style={{ padding: "12px", color: "var(--color-ink-300)", fontWeight: 500 }}>Amount</th>
                    <th style={{ padding: "12px", color: "var(--color-ink-300)", fontWeight: 500 }}>Transaction</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map(item => (
                    <tr key={item.id} style={{ borderBottom: "1px solid var(--color-border)" }}>
                      <td style={{ padding: "12px" }}>{new Date(item.created_at).toLocaleString()}</td>
                      <td style={{ padding: "12px" }}>{item.user_profiles?.full_name || item.user_profiles?.email || "Unknown"}</td>
                      <td style={{ padding: "12px", color: "var(--color-jade)", fontWeight: 600 }}>{parseFloat(item.amount).toLocaleString()} {item.currency}</td>
                      <td style={{ padding: "12px" }}>
                        <a 
                          href={`https://stellar.expert/explorer/testnet/tx/${item.tx_hash}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          style={{ color: "var(--color-saffron)", textDecoration: "underline" }}
                        >
                          {item.tx_hash.slice(0, 10)}...
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
