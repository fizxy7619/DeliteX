const features = [
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
      </svg>
    ),
    outcome: "Get paid from abroad in seconds, not days.",
    detail:
      "Stellar settles in 3–5 seconds. Your invoice gets paid; the funds arrive before the Zoom call ends.",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <line x1="2" y1="10" x2="22" y2="10" />
      </svg>
    ),
    outcome: "Pay Indian bills and UPI merchants automatically.",
    detail:
      "Your AI agent reads your rules — rent on the 1st, Netflix on the 3rd — and executes payments without you lifting a finger.",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        <line x1="12" y1="1" x2="12" y2="23" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
    outcome: "Keep more of your income with near-zero FX.",
    detail:
      "Stellar DEX liquidity delivers sub-0.3% spreads. No markup, no hidden corridor fee. The rate you see is the rate you get.",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
        <polyline points="16 7 22 7 22 13" />
      </svg>
    ),
    outcome: "Put surplus into safe yield, managed by an agent.",
    detail:
      "Idle funds earn yield through Soroban vault contracts. Rules-based: agent deploys surplus, withdraws when bills are due.",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
    outcome: "Fully compliant — no crypto knowledge needed.",
    detail:
      "INR payouts go through RBI-licensed partners. You see rupees in your account; the Stellar layer is invisible infrastructure.",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        <circle cx="12" cy="12" r="3" />
        <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
      </svg>
    ),
    outcome: "One dashboard. Full picture. Every account.",
    detail:
      "See your global income, Indian expenses, yield, and upcoming payments in one clean view — updated in real time.",
  },
];

export default function Features() {
  return (
    <section id="features" className="section" style={{ backgroundColor: "var(--color-bg)" }}>
      <div className="container-page">
        <p className="text-label" style={{ marginBottom: "16px" }}>Core features</p>

        <h2
          className="text-display-sm"
          style={{ maxWidth: "500px", marginBottom: "56px", color: "var(--color-ink-900)" }}
        >
          Built around outcomes, not features.
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "1px",
            border: "1px solid var(--color-border)",
            borderRadius: "12px",
            overflow: "hidden",
            backgroundColor: "var(--color-border)",
          }}
        >
          {features.map((f) => (
            <div
              key={f.outcome}
              style={{
                backgroundColor: "var(--color-bg-card)",
                padding: "28px",
                display: "flex",
                flexDirection: "column",
                gap: "14px",
              }}
            >
              <div
                style={{
                  width: "42px",
                  height: "42px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "8px",
                  backgroundColor: "var(--color-jade-light)",
                  color: "var(--color-jade)",
                  flexShrink: 0,
                }}
              >
                {f.icon}
              </div>
              <h3
                style={{
                  fontFamily: "var(--font-body)",
                  fontWeight: 600,
                  fontSize: "0.9375rem",
                  color: "var(--color-ink-900)",
                  lineHeight: 1.45,
                }}
              >
                {f.outcome}
              </h3>
              <p style={{ fontSize: "0.875rem", color: "var(--color-ink-500)", lineHeight: 1.65 }}>
                {f.detail}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
