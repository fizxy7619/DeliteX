"use client";

import { useState } from "react";
import Sidebar, { type Section } from "@/components/dashboard/Sidebar";
import OverviewView from "@/components/dashboard/OverviewView";
import IncomeView from "@/components/dashboard/IncomeView";
import BillsView from "@/components/dashboard/BillsView";
import FamilyView from "@/components/dashboard/FamilyView";
import SavingsView from "@/components/dashboard/SavingsView";
import RulesEditor from "@/components/dashboard/RulesEditor";
import StellarView from "@/components/dashboard/StellarView";
import AgentHistoryView from "@/components/dashboard/AgentHistoryView";
import DemoBar from "@/components/dashboard/DemoBar";
import ProfileView from "@/components/dashboard/ProfileView";
import ProceduralGroundBackground from "@/components/ui/ProceduralGroundBackground";
import { DashboardProvider, useDashboardContext } from "@/hooks/DashboardContext";
import {
  StellarWalletsKit,
  Networks,
} from "@creit.tech/stellar-wallets-kit";
import { FreighterModule } from "@creit.tech/stellar-wallets-kit/modules/freighter";
import { xBullModule } from "@creit.tech/stellar-wallets-kit/modules/xbull";
import { AlbedoModule } from "@creit.tech/stellar-wallets-kit/modules/albedo";
import { Wallet, LogOut, ExternalLink, ChevronDown } from "lucide-react";

const SECTION_TITLES: Record<Section, string> = {
  overview: "Overview",
  income: "Income",
  bills: "Bills",
  family: "Family",
  savings: "Savings",
  rules: "Rules",
  agent: "AI Agent",
  stellar: "Stellar (Testnet)",
  profile: "Profile & Settings",
};

interface DashboardShellProps {
  userEmail: string;
}

function WalletDropdown({ publicKey, onDisconnect }: { publicKey: string, onDisconnect: () => void }) {
  const [open, setOpen] = useState(false);
  
  const shortKey = `${publicKey.substring(0, 4)}...${publicKey.substring(publicKey.length - 4)}`;

  return (
    <div style={{ position: "relative" }}>
      <button 
        onClick={() => setOpen(!open)}
        style={{ display: "flex", alignItems: "center", gap: "8px", backgroundColor: "rgba(255,255,255,0.05)", border: "1px solid var(--color-border)", padding: "8px 16px", borderRadius: "100px", cursor: "pointer" }}
      >
        <Wallet size={14} color="var(--color-ink-500)" />
        <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--color-ink-900)" }}>
          {shortKey}
        </span>
        <ChevronDown size={14} color="var(--color-ink-500)" />
      </button>

      {open && (
        <div style={{ 
          position: "absolute", top: "100%", right: 0, marginTop: "8px", 
          backgroundColor: "var(--color-bg-card)", border: "1px solid var(--color-border)", 
          borderRadius: "12px", padding: "8px", width: "200px", boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
          zIndex: 100 
        }}>
          <a 
            href={`https://stellar.expert/explorer/testnet/account/${publicKey}`} 
            target="_blank" 
            rel="noreferrer"
            onClick={() => setOpen(false)}
            style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 12px", textDecoration: "none", color: "var(--color-ink-900)", fontSize: "0.8125rem", borderRadius: "8px" }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = "var(--color-border)"}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = "transparent"}
          >
            <ExternalLink size={14} color="var(--color-ink-500)" />
            View on Explorer
          </a>
          <button 
            onClick={() => {
              setOpen(false);
              onDisconnect();
            }}
            style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 12px", width: "100%", textAlign: "left", color: "var(--color-saffron)", fontSize: "0.8125rem", borderRadius: "8px", border: "none", background: "none", cursor: "pointer" }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = "rgba(234, 179, 8, 0.1)"}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = "transparent"}
          >
            <LogOut size={14} color="var(--color-saffron)" />
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
}

function DashboardContent({ userEmail }: { userEmail: string }) {
  const [activeSection, setActiveSection] = useState<Section>("overview");
  const { loading, stellarAccount, refreshStellar, updateStellarPublicKey } = useDashboardContext();
  const [funding, setFunding] = useState(false);
  const pendingDecisions = 0;

  async function handleConnectWallet() {
    try {
      setFunding(true);
      StellarWalletsKit.init({
        network: Networks.TESTNET,
        selectedWalletId: "freighter",
        modules: [new FreighterModule(), new xBullModule(), new AlbedoModule()],
      });
      
      const { address: publicKey } = await StellarWalletsKit.authModal();
      
      // Save to Supabase
      await updateStellarPublicKey(publicKey);

      // Trigger fund check
      await fetch(`/api/stellar/account?fund=true`);
      await refreshStellar();
    } catch (err) {
      console.error(err);
    } finally {
      setFunding(false);
    }
  }

  const handleDisconnect = async () => {
    try {
      await updateStellarPublicKey("");
      await refreshStellar();
    } catch(err) {
      console.error("Failed to disconnect", err);
    }
  };

  function renderSection() {
    if (loading) {
      return <div style={{ padding: "40px", color: "var(--color-ink-500)" }}>Loading real data from testnet...</div>;
    }

    if (!stellarAccount && activeSection !== "stellar") {
      return (
        <div className="card" style={{ padding: "40px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
          <div style={{ fontSize: "3rem" }}>💳</div>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "2rem", color: "var(--color-ink-900)" }}>
            Connect your Wallet
          </h2>
          <p style={{ color: "var(--color-ink-500)", maxWidth: "400px" }}>
            You need a Stellar Testnet wallet to use the dashboard. Connect with Freighter, xBull, or Albedo, and we&apos;ll automatically fund it with 10,000 XLM via Friendbot.
          </p>
          <button 
            className="btn btn-primary" 
            onClick={handleConnectWallet}
            disabled={funding}
            style={{ marginTop: "8px", fontSize: "1rem", padding: "12px 24px" }}
          >
            {funding ? "Connecting..." : "Connect Wallet"}
          </button>
        </div>
      );
    }

    switch (activeSection) {
      case "overview":  return <OverviewView />;
      case "income":    return <IncomeView />;
      case "bills":     return <BillsView />;
      case "family":    return <FamilyView />;
      case "savings":   return <SavingsView />;
      case "rules":     return <RulesEditor />;
      case "agent":     return <AgentHistoryView />;
      case "stellar":   return <StellarView />;
      case "profile":   return <ProfileView userEmail={userEmail} />;
    }
  }

  return (
    <div className="dashboard-theme" style={{ display: "flex", flexDirection: "column", minHeight: "100vh", position: "relative" }}>
      <ProceduralGroundBackground />
      <DemoBar />
      <div style={{ display: "flex", flex: 1, backgroundColor: "transparent" }}>
        <Sidebar
          activeSection={activeSection}
          onNavigate={setActiveSection}
          userEmail={userEmail}
          pendingDecisions={pendingDecisions}
        />

        {/* Main content */}
        <main
          style={{
            flex: 1,
            minWidth: 0,
            padding: "40px 40px 100px",
            maxWidth: "1400px",
          }}
        >
          {/* Page header */}
          <div style={{ marginBottom: "32px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <p style={{ fontSize: "0.75rem", color: "var(--color-ink-300)", marginBottom: "4px" }}>
                {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
              </p>
              <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.75rem", color: "var(--color-ink-900)", letterSpacing: "-0.015em" }}>
                {SECTION_TITLES[activeSection]}
              </h1>
            </div>
            {stellarAccount && (
              <WalletDropdown 
                publicKey={stellarAccount.publicKey} 
                onDisconnect={handleDisconnect} 
              />
            )}
          </div>

          {renderSection()}
        </main>

        <style>{`
          @media (max-width: 768px) {
            main { padding: 24px 16px 100px !important; }
          }
        `}</style>
      </div>
    </div>
  );
}

export default function DashboardShell(props: DashboardShellProps) {
  return (
    <DashboardProvider>
      <DashboardContent {...props} />
    </DashboardProvider>
  );
}
