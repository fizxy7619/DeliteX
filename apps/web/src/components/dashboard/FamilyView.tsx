"use client";

import { useState } from "react";
import { useDashboardContext } from "@/hooks/DashboardContext";
import { createClient } from "@/lib/supabase/client";
import type { FamilyRecipient } from "@/types/domain";
import { TransactionBuilder, Operation, Asset, rpc, BASE_FEE } from "@stellar/stellar-sdk";
import { getHorizonServer, STELLAR_NETWORK_PASSPHRASE, SOROBAN_RPC_URL } from "@/lib/stellar/config";
import { StellarWalletsKit, Networks } from "@creit.tech/stellar-wallets-kit";
import { FreighterModule } from "@creit.tech/stellar-wallets-kit/modules/freighter";
import { isConnected as isFreighterConnected } from "@stellar/freighter-api";

type RawFamily = FamilyRecipient & { monthly_allowance?: number; payee_label?: string; total_transferred_inr?: number; last_transfer_amount?: number; last_transfer_at?: string };

export default function FamilyView() {
  const { family, profile, refreshData } = useDashboardContext();
  const [activeTab, setActiveTab] = useState<"recipients" | "history">("recipients");
  
  const [isAdding, setIsAdding] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newRelationship, setNewRelationship] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [newAmount, setNewAmount] = useState("");
  
  const [sendingTo, setSendingTo] = useState<string | null>(null);

  const getMonthlyAllowance = (f: RawFamily) => f.monthlyAllowance ?? f.monthly_allowance ?? 0;
  const getPayeeLabel = (f: RawFamily) => f.payeeLabel ?? f.payee_label ?? "";

  const handleAddRecipient = async () => {
    if (!profile) return alert("Please connect or login first.");
    if (!newName || !newRelationship || !newAddress || !newAmount) return alert("Please fill all fields.");
    if (!newAddress.startsWith("G") || newAddress.length !== 56) return alert("Invalid Stellar G-address.");
    
    setIsAdding(true);
    const supabase = createClient();
    try {
      await supabase.from("family_recipients").insert({
        user_id: profile.id,
        name: newName,
        relationship: newRelationship,
        avatar_initials: newName.charAt(0).toUpperCase(),
        payee_type: "stellar",
        payee_identifier: newAddress,
        payee_label: "Stellar Wallet",
        monthly_allowance: Number(newAmount),
        allowance_enabled: Number(newAmount) > 0,
        total_transferred_inr: 0
      });
      await refreshData();
      setShowAddModal(false);
      setNewName("");
      setNewRelationship("");
      setNewAddress("");
      setNewAmount("");
    } catch (err) {
      console.error(err);
      alert("Failed to add recipient.");
    } finally {
      setIsAdding(false);
    }
  };

  const handleSendNow = async (f: RawFamily) => {
    if (!profile?.stellarPublicKey) return alert("No wallet linked to your profile.");
    
    const sendAmountInr = prompt(`Enter amount in INR to send to ${f.name}:`, getMonthlyAllowance(f).toString());
    if (!sendAmountInr || Number(sendAmountInr) <= 0) return;
    
    const xlmAmount = (Number(sendAmountInr) / 8.33).toFixed(7);
    
    setSendingTo(f.id);
    try {
      StellarWalletsKit.init({
        network: Networks.TESTNET,
        selectedWalletId: "freighter",
        modules: [new FreighterModule()],
      });
      await isFreighterConnected();
      
      const server = getHorizonServer();
      const rpcServer = new rpc.Server(SOROBAN_RPC_URL);
      
      const { address } = await StellarWalletsKit.authModal();
      const account = await server.loadAccount(address);
      
      const destination = f.payeeIdentifier;
      if (!destination || !destination.startsWith("G")) {
        throw new Error("Recipient does not have a valid Stellar address.");
      }

      const tx = new TransactionBuilder(account, { fee: BASE_FEE, networkPassphrase: STELLAR_NETWORK_PASSPHRASE })
        .addOperation(Operation.payment({
          destination: destination,
          asset: Asset.native(),
          amount: xlmAmount
        }))
        .setTimeout(300).build();

      const signResult = await StellarWalletsKit.signTransaction(tx.toXDR(), { networkPassphrase: STELLAR_NETWORK_PASSPHRASE });
      const signedTx = TransactionBuilder.fromXDR(signResult.signedTxXdr, STELLAR_NETWORK_PASSPHRASE);
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const submitRes = await rpcServer.sendTransaction(signedTx as any);
      
      if (submitRes.status === "ERROR") throw new Error("Transaction failed to submit.");
      
      let isSuccess = false;
      for (let i = 0; i < 10; i++) {
        await new Promise(resolve => setTimeout(resolve, 1500));
        const status = await rpcServer.getTransaction(submitRes.hash);
        if (status.status === "SUCCESS") {
           isSuccess = true;
           break;
        } else if (status.status === "FAILED") {
           throw new Error("Transaction failed on-chain.");
        }
      }
      
      if (!isSuccess) throw new Error("Transaction timed out.");

      const supabase = createClient();
      await supabase.from("family_recipients").update({
        last_transfer_amount: Number(sendAmountInr),
        last_transfer_at: new Date().toISOString(),
        total_transferred_inr: (f.totalTransferredInr || 0) + Number(sendAmountInr)
      }).eq("id", f.id);
      
      alert(`Successfully sent ${xlmAmount} XLM to ${f.name}!`);
      await refreshData();
      
    } catch (err) {
      console.error(err);
      alert("Failed to send: " + ((err as Error).message || "Unknown error"));
    } finally {
      setSendingTo(null);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "2rem", color: "var(--color-ink-900)", letterSpacing: "-0.02em" }}>
            Family & Remittances
          </h2>
          <p style={{ fontSize: "0.875rem", color: "var(--color-ink-500)", marginTop: "6px" }}>
            Manage monthly allowances and send money home.
          </p>
        </div>
        <button 
          className="btn btn-primary" 
          style={{ fontSize: "0.875rem", padding: "8px 16px" }}
          onClick={() => setShowAddModal(true)}
        >
          + Add recipient
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "24px", borderBottom: "1px solid var(--color-border)" }}>
        {(["recipients", "history"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            style={{
              background: "none", border: "none",
              padding: "0 0 12px",
              fontSize: "0.875rem", fontWeight: activeTab === t ? 600 : 500,
              color: activeTab === t ? "var(--color-ink-900)" : "var(--color-ink-500)",
              borderBottom: activeTab === t ? "2px solid var(--color-ink-900)" : "2px solid transparent",
              cursor: "pointer",
              textTransform: "capitalize",
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {activeTab === "recipients" ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "16px" }}>
          {family.length === 0 ? (
            <div style={{ padding: "40px", textAlign: "center", backgroundColor: "var(--color-bg-card)", color: "var(--color-ink-500)", fontSize: "0.875rem", borderRadius: "12px", border: "1px solid var(--color-border)", gridColumn: "1 / -1" }}>
              No family recipients found.
            </div>
          ) : family.map((f: RawFamily) => (
            <div key={f.id} className="card" style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <div style={{
                  width: "48px", height: "48px", borderRadius: "50%",
                  backgroundColor: "var(--color-ink-100)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "1.25rem", fontWeight: 600, color: "var(--color-ink-700)"
                }}>
                  {f.name.charAt(0)}
                </div>
                <div>
                  <p style={{ fontWeight: 600, color: "var(--color-ink-900)" }}>{f.name}</p>
                  <p style={{ fontSize: "0.75rem", color: "var(--color-ink-500)", marginTop: "2px" }}>
                    {f.relationship} · {getPayeeLabel(f)}
                  </p>
                </div>
              </div>

              <div style={{ padding: "16px", backgroundColor: "var(--color-bg-card)", borderRadius: "8px", border: "1px solid var(--color-border)" }}>
                <p style={{ fontSize: "0.75rem", color: "var(--color-ink-500)", marginBottom: "4px" }}>Monthly Allowance</p>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                  <p style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", color: "var(--color-ink-900)" }}>
                    ₹{Number(getMonthlyAllowance(f)).toLocaleString("en-IN")}
                  </p>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                    <div style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "var(--color-jade)" }} />
                    <span style={{ fontSize: "0.6875rem", fontWeight: 600, color: "var(--color-jade)", textTransform: "uppercase" }}>Active</span>
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", gap: "8px" }}>
                <button className="btn btn-primary" style={{ flex: 1, padding: "8px", fontSize: "0.875rem", backgroundColor: "var(--color-ink-900)" }} onClick={() => handleSendNow(f)} disabled={sendingTo === f.id}>
                  {sendingTo === f.id ? "Sending..." : "Send Now"}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ padding: "40px", textAlign: "center", backgroundColor: "#fff", color: "var(--color-ink-500)", fontSize: "0.875rem", borderRadius: "12px", border: "1px solid var(--color-border)" }}>
          No transfer history available yet.
        </div>
      )}

      {/* Add Recipient Modal */}
      {showAddModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }}>
          <div className="card" style={{ width: "400px", padding: "24px", display: "flex", flexDirection: "column", gap: "16px", backgroundColor: "#fff", borderRadius: "16px" }}>
            <h3 style={{ fontSize: "1.25rem", fontWeight: 600, color: "#1E293B" }}>Add Family Recipient</h3>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <input type="text" placeholder="Name" className="input" style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #E2E8F0" }} value={newName} onChange={e => setNewName(e.target.value)} />
              <input type="text" placeholder="Relationship (e.g. Mother)" className="input" style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #E2E8F0" }} value={newRelationship} onChange={e => setNewRelationship(e.target.value)} />
              <input type="text" placeholder="Stellar G-Address" className="input" style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #E2E8F0" }} value={newAddress} onChange={e => setNewAddress(e.target.value)} />
              <input type="number" placeholder="Monthly Allowance (INR)" className="input" style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #E2E8F0" }} value={newAmount} onChange={e => setNewAmount(e.target.value)} />
            </div>

            <div style={{ display: "flex", gap: "12px", marginTop: "8px", justifyContent: "flex-end" }}>
              <button className="btn btn-ghost" style={{ padding: "8px 16px" }} onClick={() => setShowAddModal(false)}>Cancel</button>
              <button className="btn btn-primary" style={{ padding: "8px 16px" }} onClick={handleAddRecipient} disabled={isAdding}>{isAdding ? "Adding..." : "Add"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
