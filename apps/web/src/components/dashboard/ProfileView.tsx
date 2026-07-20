"use client";

import { useDashboardContext } from "@/hooks/DashboardContext";
import { useState } from "react";

export default function ProfileView({ userEmail }: { userEmail: string }) {
  const { stellarAccount } = useDashboardContext();
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (stellarAccount?.publicKey) {
      navigator.clipboard.writeText(stellarAccount.publicKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "32px", maxWidth: "600px" }}>
      <div className="card">
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", marginBottom: "24px" }}>
          User Details
        </h2>
        
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <div>
            <p className="text-label" style={{ marginBottom: "8px" }}>Email Address</p>
            <p style={{ fontSize: "1rem", color: "var(--color-ink-900)" }}>{userEmail}</p>
          </div>
          
          <div>
            <p className="text-label" style={{ marginBottom: "8px" }}>Connected Wallet</p>
            {stellarAccount ? (
              <div style={{ display: "flex", alignItems: "center", gap: "12px", background: "rgba(255,255,255,0.05)", padding: "12px 16px", borderRadius: "8px", border: "1px solid var(--color-border)" }}>
                <code style={{ flex: 1, fontSize: "0.875rem", wordBreak: "break-all", color: "var(--color-ink-700)" }}>
                  {stellarAccount.publicKey}
                </code>
                <button 
                  onClick={handleCopy}
                  className="btn btn-ghost" 
                  style={{ padding: "6px 12px", fontSize: "0.75rem", flexShrink: 0 }}
                >
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
            ) : (
              <p style={{ fontSize: "0.875rem", color: "var(--color-ink-500)" }}>No wallet connected yet.</p>
            )}
          </div>
        </div>
      </div>
      
      {stellarAccount && (
        <div className="card" style={{ background: "transparent", border: "1px dashed var(--color-border)", boxShadow: "none" }}>
           <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "8px" }}>Explore on Testnet</h3>
           <p style={{ fontSize: "0.875rem", color: "var(--color-ink-500)", marginBottom: "16px" }}>
             View your full transaction history and token balances on the Stellar Expert block explorer.
           </p>
           <a 
              href={`https://stellar.expert/explorer/testnet/account/${stellarAccount.publicKey}`}
              target="_blank"
              rel="noreferrer"
              className="btn btn-saffron"
           >
             Open Stellar Expert ↗
           </a>
        </div>
      )}
    </div>
  );
}
