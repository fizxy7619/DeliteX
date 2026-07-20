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
import { DashboardProvider, useDashboardContext } from "@/hooks/DashboardContext";
import {
  StellarWalletsKit,
  Networks,
} from "@creit.tech/stellar-wallets-kit";
import { FreighterModule } from "@creit.tech/stellar-wallets-kit/modules/freighter";
import { xBullModule } from "@creit.tech/stellar-wallets-kit/modules/xbull";
import { AlbedoModule } from "@creit.tech/stellar-wallets-kit/modules/albedo";

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
    <div className="dashboard-theme" style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <DemoBar />
      <div style={{ display: "flex", flex: 1, backgroundColor: "var(--color-bg)" }}>
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
            maxWidth: "900px",
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
              <a 
                href={`https://stellar.expert/explorer/testnet/account/${stellarAccount.publicKey}`} 
                target="_blank" 
                rel="noreferrer"
                style={{ display: "flex", alignItems: "center", gap: "8px", backgroundColor: "var(--color-jade-light)", padding: "6px 12px", borderRadius: "100px", textDecoration: "none" }}
              >
                <span style={{ width: "8px", height: "8px", backgroundColor: "var(--color-jade)", borderRadius: "50%" }} />
                <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--color-jade)" }}>
                  Testnet Connected (Verify)
                </span>
              </a>
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
