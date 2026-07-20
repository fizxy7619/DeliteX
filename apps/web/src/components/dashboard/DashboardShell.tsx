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

const SECTION_TITLES: Record<Section, string> = {
  overview: "Overview",
  income: "Income",
  bills: "Bills",
  family: "Family",
  savings: "Savings",
  rules: "Rules",
  agent: "AI Agent",
  stellar: "Stellar (Testnet)",
};

interface DashboardShellProps {
  userEmail: string;
}

export default function DashboardShell({ userEmail }: DashboardShellProps) {
  const [activeSection, setActiveSection] = useState<Section>("overview");
  const pendingDecisions = 0;

  function renderSection() {
    switch (activeSection) {
      case "overview":  return <OverviewView />;
      case "income":    return <IncomeView />;
      case "bills":     return <BillsView />;
      case "family":    return <FamilyView />;
      case "savings":   return <SavingsView />;
      case "rules":     return <RulesEditor />;
      case "agent":     return <AgentHistoryView />;
      case "stellar":   return <StellarView />;
    }
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "var(--color-bg)" }}>
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
        <div style={{ marginBottom: "32px" }}>
          <p style={{ fontSize: "0.75rem", color: "var(--color-ink-300)", marginBottom: "4px" }}>
            {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.75rem", color: "var(--color-ink-900)", letterSpacing: "-0.015em" }}>
            {SECTION_TITLES[activeSection]}
          </h1>
        </div>

        {renderSection()}
      </main>

      <style>{`
        @media (max-width: 768px) {
          main { padding: 24px 16px 100px !important; }
        }
      `}</style>
    </div>
  );
}
