"use client";

import { useEffect, useState } from "react";
import {
  generateKeypair,
  fundTestnetAccount,
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

export default function AdminPage() {
  const [masterSecret, setMasterSecret] = useState("");
  const [masterPublic, setMasterPublic] = useState("");
  const [balances, setBalances] = useState<StellarBalance[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [funding, setFunding] = useState(false);
  const [sendingId, setSendingId] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("MASTER_WALLET_SECRET");
    if (stored) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMasterSecret(stored);
      // We can't derive public key synchronously without stellar-sdk easily here unless we import Keypair
      // But we can just use stellar-sdk if we add the import. For simplicity, we just fetch balances
      // by first deriving the public key.
      import("@stellar/stellar-sdk").then(({ Keypair }) => {
        try {
          const kp = Keypair.fromSecret(stored);
          setMasterPublic(kp.publicKey());
          getAccountBalances(kp.publicKey()).then(acc => {
            if (acc) setBalances(acc.balances);
          });
        } catch {
          console.error("Invalid secret in localStorage");
        }
      });
    }

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
      const kp = generateKeypair();
      const success = await fundTestnetAccount(kp.publicKey);
      if (!success) throw new Error("Friendbot failed");
      
      localStorage.setItem("MASTER_WALLET_SECRET", kp.secretKey);
      setMasterSecret(kp.secretKey);
      setMasterPublic(kp.publicKey);
      
      // Wait a moment for Horizon to index
      await new Promise(r => setTimeout(r, 2000));
      const acc = await getAccountBalances(kp.publicKey);
      if (acc) setBalances(acc.balances);
    } catch (err) {
      alert("Failed to initialize Master Wallet: " + (err as Error).message);
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

      alert(`Successfully sent 1000 XLM to ${user.full_name}!`);
      
      // Refresh Master Wallet Balance
      const acc = await getAccountBalances(masterPublic);
      if (acc) setBalances(acc.balances);

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
                No Master Wallet found in localStorage. Generate one to act as the Employer/Admin.
              </p>
              <button 
                className="btn btn-primary" 
                onClick={handleGenerateAndFund}
                disabled={funding}
              >
                {funding ? "Generating & Funding..." : "Generate & Fund with 10k XLM"}
              </button>
            </div>
          ) : (
            <div>
              <p style={{ fontSize: "0.875rem", color: "var(--color-ink-300)", wordBreak: "break-all", marginBottom: "16px" }}>
                <strong>Public Key:</strong> {masterPublic}
              </p>
              <div style={{ display: "flex", gap: "16px" }}>
                {balances.map(b => (
                  <div key={b.asset} style={{ backgroundColor: "rgba(255,255,255,0.05)", padding: "12px 20px", borderRadius: "8px" }}>
                    <p style={{ fontSize: "0.75rem", color: "var(--color-ink-500)", textTransform: "uppercase" }}>{b.asset === "native" ? "XLM" : b.asset}</p>
                    <p style={{ fontSize: "1.5rem", fontWeight: 600 }}>{parseFloat(b.balance).toLocaleString("en-US")}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="card" style={{ padding: "32px" }}>
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
      </div>
    </div>
  );
}
