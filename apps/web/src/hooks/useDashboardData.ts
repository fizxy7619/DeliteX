import { useState, useEffect, useCallback } from "react";
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
  const supabase = createClient();
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

      setProfile(pData as UserProfile);
      setPaymentEvents((peData || []) as PaymentEvent[]);
      setBills((bData || []) as Bill[]);
      setFamily((fData || []) as FamilyRecipient[]);
      setVault(vData as SavingsVault | null);
      setRules((rData || []) as AllocationRule[]);
      setAiMessages((mData || []) as AiMessage[]);

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
        if (data.publicKey && !profile?.stellar_public_key) {
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
