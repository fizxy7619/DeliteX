"use client";

import { useDashboardContext } from "@/hooks/DashboardContext";
import { useState } from "react";
import { TransactionBuilder, Contract, Address, nativeToScVal, rpc, BASE_FEE } from "@stellar/stellar-sdk";
import { getHorizonServer, STELLAR_NETWORK_PASSPHRASE, SOROBAN_RPC_URL } from "@/lib/stellar/config";
import { StellarWalletsKit, Networks } from "@creit.tech/stellar-wallets-kit";
import { FreighterModule } from "@creit.tech/stellar-wallets-kit/modules/freighter";
import { isConnected as isFreighterConnected } from "@stellar/freighter-api";

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
      if (!process.env.NEXT_PUBLIC_SOROBAN_VAULT) throw new Error("Vault not configured");
      // Assuming profile pubkey is known or we can get it from Freighter
      StellarWalletsKit.init({
        network: Networks.TESTNET,
        selectedWalletId: "freighter",
        modules: [new FreighterModule()],
      });
      await isFreighterConnected();
      
      const server = getHorizonServer();
      const rpcServer = new rpc.Server(SOROBAN_RPC_URL);
      
      // Request access to get pubkey if not cached
      const { address } = await StellarWalletsKit.authModal();
      const account = await server.loadAccount(address);
      
      const contract = new Contract(process.env.NEXT_PUBLIC_SOROBAN_VAULT);
      const amountStroops = BigInt(Math.floor(Number(depositAmount) * 10000000));

      let tx = new TransactionBuilder(account, { fee: BASE_FEE, networkPassphrase: STELLAR_NETWORK_PASSPHRASE })
        .addOperation(contract.call("deposit", new Address(address).toScVal(), new Address(address).toScVal(), nativeToScVal(amountStroops, { type: "i128" })))
        .setTimeout(300).build();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      tx = await rpcServer.prepareTransaction(tx) as any;
      const signResult = await StellarWalletsKit.signTransaction(tx.toXDR(), { networkPassphrase: STELLAR_NETWORK_PASSPHRASE });
      
      const txToSubmit = TransactionBuilder.fromXDR(signResult.signedTxXdr, STELLAR_NETWORK_PASSPHRASE);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const submitRes = await rpcServer.sendTransaction(txToSubmit as any);
      
      if (submitRes.status === "ERROR") throw new Error("Submission failed");
      
      // Poll
      for (let i = 0; i < 15; i++) {
        await new Promise(r => setTimeout(r, 2000));
        const status = await rpcServer.getTransaction(submitRes.hash);
        if (status.status === "SUCCESS") break;
        if (status.status === "FAILED") throw new Error("Transaction failed on-chain");
      }
      
      // Also notify backend to update DB if needed, but since we fetch from contract, just refresh
      // await fetch("/api/vault/deposit", { method: "POST", body: JSON.stringify({ amountUsdc: Number(depositAmount), strategy: "conservative" }) });
      
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
    if (vaultValue < 10) {
      alert("Not enough funds to withdraw 10 USDC!");
      return;
    }
    
    setIsDepositing(true);
    try {
      if (!process.env.NEXT_PUBLIC_SOROBAN_VAULT) throw new Error("Vault not configured");
      
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
      
      const contract = new Contract(process.env.NEXT_PUBLIC_SOROBAN_VAULT);
      const amountStroops = BigInt(10 * 10000000); // 10 USDC

      let tx = new TransactionBuilder(account, { fee: BASE_FEE, networkPassphrase: STELLAR_NETWORK_PASSPHRASE })
        .addOperation(contract.call("withdraw", new Address(address).toScVal(), nativeToScVal(amountStroops, { type: "i128" })))
        .setTimeout(300).build();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      tx = await rpcServer.prepareTransaction(tx) as any;
      const signResult = await StellarWalletsKit.signTransaction(tx.toXDR(), { networkPassphrase: STELLAR_NETWORK_PASSPHRASE });
      
      const txToSubmit = TransactionBuilder.fromXDR(signResult.signedTxXdr, STELLAR_NETWORK_PASSPHRASE);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const submitRes = await rpcServer.sendTransaction(txToSubmit as any);
      
      if (submitRes.status === "ERROR") throw new Error("Submission failed");
      
      for (let i = 0; i < 15; i++) {
        await new Promise(r => setTimeout(r, 2000));
        const status = await rpcServer.getTransaction(submitRes.hash);
        if (status.status === "SUCCESS") break;
        if (status.status === "FAILED") throw new Error("Transaction failed on-chain");
      }
      
      // Update DB to reflect withdrawal if needed, but fetchVaultBalance handles real balance
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
