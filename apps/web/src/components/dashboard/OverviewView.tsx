import { useDashboardContext } from "@/hooks/DashboardContext";
import type { Bucket } from "@/types/domain";

function fmt(n: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}

function BucketCard({ bucket }: { bucket: Bucket }) {
  const colors: Record<string, { bg: string; fg: string }> = {
    income: { bg: "var(--color-jade-light)", fg: "var(--color-jade)" },
    bills: { bg: "var(--color-saffron-light)", fg: "var(--color-saffron)" },
    family: { bg: "#EEF2FF", fg: "#4F46E5" },
    savings: { bg: "#F0FDF4", fg: "#16A34A" },
  };
  const c = colors[bucket.type];

  return (
    <div
      className="card"
      style={{ display: "flex", flexDirection: "column", gap: "16px" }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "0.8125rem",
            fontWeight: 600,
            color: c.fg,
            backgroundColor: c.bg,
            borderRadius: "100px",
            padding: "4px 10px",
          }}
        >
          {bucket.label}
        </span>
        <span style={{ fontSize: "0.75rem", color: "var(--color-ink-300)" }}>
          {bucket.nativeCurrency}
        </span>
      </div>
      <div>
        <p style={{ fontFamily: "var(--font-display)", fontSize: "1.75rem", color: "var(--color-ink-900)", lineHeight: 1.15 }}>
          {fmt(bucket.balanceInr)}
        </p>
        <p style={{ fontSize: "0.8125rem", color: "var(--color-ink-500)", marginTop: "4px" }}>
          {bucket.balanceNative.toLocaleString("en-US", { maximumFractionDigits: 2 })} {bucket.nativeCurrency} · {bucket.description}
        </p>
      </div>
    </div>
  );
}

export default function OverviewView() {
  const { paymentEvents, stellarAccount, vault, bills, family } = useDashboardContext();

  // Temporary FX rate for demo (testnet USDC -> INR)
  const USDC_INR = 84.1;
  const XLM_INR = 10.5; // Approx FX rate for XLM

  // Real data parsing
  const usdcBalance = parseFloat(stellarAccount?.balances.find(b => b.asset === "USDC")?.balance || "0");
  const xlmBalance = parseFloat(stellarAccount?.balances.find(b => b.asset === "native")?.balance || "0");
  
  // Calculate bucket totals from real DB data
  const billsTotal = bills.reduce((sum, b) => sum + (Number(b.amount) || 0), 0);
  const familyTotal = family.reduce((sum, f) => sum + (Number(f.monthlyAllowance) || 0), 0);
  
  const buckets: Bucket[] = [
    {
      type: "income",
      label: "Wallet",
      description: "Available crypto balance",
      balanceNative: xlmBalance > 0 ? xlmBalance : usdcBalance,
      balanceInr: (usdcBalance * USDC_INR) + (xlmBalance * XLM_INR),
      nativeCurrency: xlmBalance > 0 ? "XLM" : "USDC",
      stellarAccountOrContractId: stellarAccount?.publicKey || null,
    },
    {
      type: "bills",
      label: "Bills",
      description: "Recurring obligations",
      balanceNative: billsTotal,
      balanceInr: billsTotal,
      nativeCurrency: "INR",
      stellarAccountOrContractId: null,
    },
    {
      type: "family",
      label: "Family",
      description: "Monthly allowances & remittances",
      balanceNative: familyTotal,
      balanceInr: familyTotal,
      nativeCurrency: "INR",
      stellarAccountOrContractId: null,
    },
    {
      type: "savings",
      label: "Savings",
      description: "Yield vault (Soroban)",
      balanceNative: vault?.totalValueUsdc || 0,
      balanceInr: (vault?.totalValueUsdc || 0) * USDC_INR,
      nativeCurrency: "USDC",
      stellarAccountOrContractId: vault?.sorobanContractId || null,
    },
  ];

  const totalInr = buckets.reduce((s, b) => s + b.balanceInr, 0);
  const recentEvents = paymentEvents.slice(0, 4);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
      {/* Total balance hero */}
      <div>
        <p className="text-label" style={{ marginBottom: "8px" }}>Total portfolio value</p>
        <p style={{ fontFamily: "var(--font-display)", fontSize: "3rem", color: "var(--color-ink-900)", letterSpacing: "-0.02em", lineHeight: 1 }}>
          {fmt(totalInr)}
        </p>
        <p style={{ fontSize: "0.875rem", color: "var(--color-ink-500)", marginTop: "8px" }}>
          Across 4 buckets · Updated just now
        </p>
      </div>

      {/* Bucket cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
        {buckets.map((b) => <BucketCard key={b.type} bucket={b} />)}
      </div>

      {/* Quick stats bar */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          gap: "1px",
          border: "1px solid var(--color-border)",
          borderRadius: "12px",
          overflow: "hidden",
          backgroundColor: "var(--color-border)",
        }}
      >
        {[
          { label: "This month income", value: fmt(usdcBalance * USDC_INR) },
          { label: "Bills due this month", value: fmt(billsTotal) },
          { label: "Family transferred", value: fmt(familyTotal) },
          { label: "Yield earned (USDC)", value: `+$${(vault?.yieldEarnedUsdc || 0).toFixed(2)}` },
        ].map((s) => (
          <div key={s.label} style={{ backgroundColor: "var(--color-bg-card)", padding: "20px" }}>
            <p style={{ fontSize: "0.75rem", color: "var(--color-ink-500)", marginBottom: "6px" }}>{s.label}</p>
            <p style={{ fontFamily: "var(--font-display)", fontSize: "1.375rem", color: "var(--color-ink-900)" }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Recent activity */}
      <div>
        <p style={{ fontWeight: 600, fontSize: "0.9375rem", color: "var(--color-ink-900)", marginBottom: "16px" }}>Recent activity</p>
        <div style={{ display: "flex", flexDirection: "column", gap: "0", border: "1px solid var(--color-border)", borderRadius: "12px", overflow: "hidden", backgroundColor: "var(--color-bg-card)" }}>
          {recentEvents.length === 0 ? (
            <div style={{ padding: "20px", textAlign: "center", color: "var(--color-ink-500)", fontSize: "0.875rem" }}>
              No recent activity found.
            </div>
          ) : recentEvents.map((row, i) => {
            const isPos = row.direction === "incoming";
            const amountStr = `${isPos ? "+" : "−"}${row.currency === "USDC" ? "$" : "₹"}${row.amount}`;
            
            return (
              <div
                key={row.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "14px 20px",
                  borderBottom: i < recentEvents.length - 1 ? "1px solid var(--color-border)" : "none",
                }}
              >
                <div>
                  <p style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--color-ink-900)" }}>
                    {row.description}
                  </p>
                  <p style={{ fontSize: "0.75rem", color: "var(--color-ink-500)", marginTop: "2px" }}>
                    {row.settledAt ? new Date(row.settledAt).toLocaleDateString() : "Pending"}
                  </p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p style={{ fontSize: "0.875rem", fontWeight: 600, color: isPos ? "var(--color-jade)" : "var(--color-ink-700)" }}>
                    {amountStr}
                  </p>
                  <span style={{
                    fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase",
                    color: row.status === "pending" ? "var(--color-saffron)" : "var(--color-jade)",
                  }}>
                    {row.status}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
