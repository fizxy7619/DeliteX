"use client";

import React, { createContext, useContext, ReactNode } from "react";
import { useDashboardData, StellarAccountInfo } from "./useDashboardData";
import type {
  PaymentEvent,
  Bill,
  FamilyRecipient,
  SavingsVault,
  AllocationRule,
  AiMessage,
  UserProfile,
} from "@/types/domain";

interface DashboardContextType {
  loading: boolean;
  error: string | null;
  profile: UserProfile | null;
  paymentEvents: PaymentEvent[];
  bills: Bill[];
  family: FamilyRecipient[];
  vault: SavingsVault | null;
  rules: AllocationRule[];
  aiMessages: AiMessage[];
  stellarAccount: StellarAccountInfo | null;
  refreshData: () => Promise<void>;
  refreshStellar: (fund?: boolean) => Promise<any>;
  updateStellarPublicKey: (publicKey: string) => Promise<boolean>;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export function DashboardProvider({ children }: { children: ReactNode }) {
  const data = useDashboardData();
  return <DashboardContext.Provider value={data}>{children}</DashboardContext.Provider>;
}

export function useDashboardContext() {
  const context = useContext(DashboardContext);
  if (context === undefined) {
    throw new Error("useDashboardContext must be used within a DashboardProvider");
  }
  return context;
}
