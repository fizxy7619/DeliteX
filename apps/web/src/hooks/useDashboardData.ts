import { useState, useEffect, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import type {
  PaymentEvent,
  Bill,
  FamilyRecipient,
  SavingsVault,
  AllocationRule,
  AiMessage,
  UserProfile,
} from "@/types/domain";

export interface StellarAccountInfo {
  publicKey: string;
  balances: { asset: string; balance: string; issuer?: string }[];
  isTestnet: boolean;
  explorerUrl: string;
  isNew?: boolean;
}

export function useDashboardData() {
  const supabase = useMemo(() => createClient(), []);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [paymentEvents, setPaymentEvents] = useState<PaymentEvent[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [family, setFamily] = useState<FamilyRecipient[]>([]);
  const [vault, setVault] = useState<SavingsVault | null>(null);
  const [rules, setRules] = useState<AllocationRule[]>([]);
  const [aiMessages, setAiMessages] = useState<AiMessage[]>([]);
  const [stellarAccount, setStellarAccount] = useState<StellarAccountInfo | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const [
        { data: pData },
        { data: peData },
        { data: bData },
        { data: fData },
        { data: vData },
        { data: rData },
        { data: mData },
      ] = await Promise.all([
        supabase.from("user_profiles").select("*").eq("id", user.id).single(),
        supabase.from("payment_events").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("bills").select("*").eq("user_id", user.id).order("next_due_date", { ascending: true }),
        supabase.from("family_recipients").select("*").eq("user_id", user.id),
        supabase.from("savings_vaults").select("*").eq("user_id", user.id).single(),
        supabase.from("allocation_rules").select("*").eq("user_id", user.id),
        supabase.from("ai_chat_messages").select("*").eq("user_id", user.id).order("created_at", { ascending: true }),
      ]);

      setProfile({
        ...pData,
        fullName: pData?.full_name,
        avatarUrl: pData?.avatar_url,
        kycStatus: pData?.kyc_status,
        stellarPublicKey: pData?.stellar_public_key,
        inrPayoutMethod: pData?.inr_payout_method,
        notifyOnIncoming: pData?.notify_on_incoming,
        notifyOnPayout: pData?.notify_on_payout,
        createdAt: pData?.created_at,
        updatedAt: pData?.updated_at
      } as UserProfile);

      setPaymentEvents((peData || []).map((pe: any) => ({
        ...pe,
        userId: pe.user_id,
        inrEquivalent: pe.inr_equivalent,
        fxRate: pe.fx_rate,
        fxSpreadPercent: pe.fx_spread_percent,
        stellarTxHash: pe.stellar_tx_hash,
        stellarLedger: pe.stellar_ledger,
        sorobanContractId: pe.soroban_contract_id,
        settledAt: pe.settled_at,
        createdAt: pe.created_at
      })));

      setBills((bData || []).map((b: any) => ({
        ...b,
        userId: b.user_id,
        payeeType: b.payee_type,
        dueDayOfMonth: b.due_day_of_month,
        nextDueDate: b.next_due_date,
        isPaused: b.is_paused,
        isAutopayEnabled: b.is_autopay_enabled,
        lastPaidAt: b.last_paid_at,
        lastPaidAmount: b.last_paid_amount,
        createdAt: b.created_at
      })));

      setFamily((fData || []).map((f: any) => ({
        ...f,
        userId: f.user_id,
        avatarInitials: f.avatar_initials,
        payeeType: f.payee_type,
        payeeIdentifier: f.payee_identifier,
        payeeLabel: f.payee_label,
        monthlyAllowance: f.monthly_allowance,
        allowanceEnabled: f.allowance_enabled,
        lastTransferAmount: f.last_transfer_amount,
        lastTransferAt: f.last_transfer_at,
        totalTransferredInr: f.total_transferred_inr,
        createdAt: f.created_at
      })));

      setVault(vData ? {
        ...vData,
        userId: vData.user_id,
        principalUsdc: vData.principal_usdc,
        totalValueUsdc: vData.total_value_usdc,
        yieldEarnedUsdc: vData.yield_earned_usdc,
        estimatedApyPercent: vData.estimated_apy_percent,
        sorobanContractId: vData.soroban_contract_id,
        vaultSharesHeld: vData.vault_shares_held,
        autoDepositThresholdInr: vData.auto_deposit_threshold_inr,
        autoDepositEnabled: vData.auto_deposit_enabled,
        lastYieldClaimedAt: vData.last_yield_claimed_at,
        updatedAt: vData.updated_at
      } : null);

      setRules((rData || []).map((r: any) => ({
        ...r,
        userId: r.user_id,
        incomeSourceFilter: r.income_source_filter,
        isActive: r.is_active,
        aiGenerated: r.ai_generated,
        aiPrompt: r.ai_prompt,
        createdAt: r.created_at,
        updatedAt: r.updated_at
      })));

      setAiMessages((mData || []).map((m: any) => ({
        ...m,
        parsedRule: m.parsed_rule,
        llmModel: m.llm_model,
        llmLatencyMs: m.llm_latency_ms,
        createdAt: m.created_at
      })));

      // Fetch stellar account
      if (pData?.stellar_public_key) {
        try {
          const res = await fetch("/api/stellar/account");
          const data = await res.json();
          if (res.ok && data.accountInfo) {
            setStellarAccount({ ...data.accountInfo, isNew: data.isNew });
          }
        } catch (err) {
          console.error("Failed to fetch stellar account:", err);
        }
      } else {
        setStellarAccount(null);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchData]);

  // Refreshes only stellar account
  const refreshStellar = async (fund = false) => {
    try {
      const res = await fetch(`/api/stellar/account${fund ? "?fund=true" : ""}`);
      const data = await res.json();
      if (res.ok) {
        if (data.accountInfo) {
          setStellarAccount({ ...data.accountInfo, isNew: data.isNew });
        }
        // Reload profile if we just generated a key
        if (data.publicKey && !profile?.stellarPublicKey) {
          await fetchData();
        }
        return { success: true, data };
      }
      return { success: false, error: data.error };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  };

  // Updates public key in Supabase and refreshes data
  const updateStellarPublicKey = async (publicKey: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("user_profiles").update({ stellar_public_key: publicKey }).eq("id", user.id);
        await fetchData();
        return true;
      }
      return false;
    } catch (err) {
      console.error("Failed to update public key:", err);
      return false;
    }
  };

  return {
    loading,
    error,
    profile,
    paymentEvents,
    bills,
    family,
    vault,
    rules,
    aiMessages,
    stellarAccount,
    refreshData: fetchData,
    refreshStellar,
    updateStellarPublicKey,
  };
}
