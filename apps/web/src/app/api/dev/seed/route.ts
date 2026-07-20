import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { v4 as uuidv4 } from "uuid";

export async function GET(req: NextRequest) {
  // Use service role to bypass RLS for seeding if needed, or anon key if RLS allows it for authenticated users.
  // We'll use the user ID from the request or require it as a query param.
  const userId = req.nextUrl.searchParams.get("userId");
  
  if (!userId) {
    return NextResponse.json({ error: "Missing userId query param" }, { status: 400 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // 1. Bills
    const bills = [
      { id: uuidv4(), user_id: userId, name: "Rent - Downtown Apartment", amount: 18000, currency: "INR", frequency: "monthly", next_due_date: "2026-08-01", is_autopay_enabled: true },
      { id: uuidv4(), user_id: userId, name: "Electricity (TATA Power)", amount: 2450, currency: "INR", frequency: "monthly", next_due_date: "2026-07-28", is_autopay_enabled: true },
      { id: uuidv4(), user_id: userId, name: "Internet (JioFiber)", amount: 999, currency: "INR", frequency: "monthly", next_due_date: "2026-07-20", is_autopay_enabled: false },
    ];
    await supabase.from("bills").delete().eq("user_id", userId);
    await supabase.from("bills").insert(bills);

    // 2. Family
    const family = [
      { id: uuidv4(), user_id: userId, name: "Dad", relation: "Parent", destination_bank: "HDFC Bank", monthly_allowance: 10000, currency: "INR", stellar_account_id: null },
      { id: uuidv4(), user_id: userId, name: "Mom", relation: "Parent", destination_bank: "ICICI Bank", monthly_allowance: 5000, currency: "INR", stellar_account_id: null },
    ];
    await supabase.from("family_recipients").delete().eq("user_id", userId);
    await supabase.from("family_recipients").insert(family);

    // 3. Payment Events
    const events = [
      { id: uuidv4(), user_id: userId, amount: 2000, currency: "USDC", direction: "incoming", counterparty: "GlobalOps Ltd.", description: "Invoice #INV-2026-041", status: "pending", inr_equivalent: null },
      { id: uuidv4(), user_id: userId, amount: 1200, currency: "USDC", direction: "incoming", counterparty: "Acme Corp", description: "Invoice #INV-2024-038", status: "completed", inr_equivalent: 100800, settled_at: new Date(Date.now() - 2 * 86400000).toISOString() },
      { id: uuidv4(), user_id: userId, amount: 18000, currency: "INR", direction: "outgoing", counterparty: "Landlord", description: "Rent - July 2026", status: "completed", inr_equivalent: 18000, settled_at: new Date(Date.now() - 15 * 86400000).toISOString() },
    ];
    await supabase.from("payment_events").delete().eq("user_id", userId);
    await supabase.from("payment_events").insert(events);

    // 4. Rules
    const rules = [
      { id: uuidv4(), user_id: userId, name: "Standard Allocation", condition: "Incoming > 0", action: "30% Savings, 40% Bills, 15% Family", is_active: true },
      { id: uuidv4(), user_id: userId, name: "Bonus Sweeper", condition: "Incoming > 5000 USDC", action: "100% to Savings", is_active: false },
    ];
    await supabase.from("allocation_rules").delete().eq("user_id", userId);
    await supabase.from("allocation_rules").insert(rules);

    // 5. Vault
    await supabase.from("savings_vaults").delete().eq("user_id", userId);
    await supabase.from("savings_vaults").insert({
      id: uuidv4(),
      user_id: userId,
      total_value_usdc: 15420.50,
      yield_earned_usdc: 58.40,
      current_apy: 5.25
    });

    return NextResponse.json({ success: true, message: "Database seeded successfully for user " + userId });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
