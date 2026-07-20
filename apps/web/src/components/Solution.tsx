// Solution section — shows the money flow diagram
// Global income → Stellar settlement → INR conversion → AI payments + yield

const steps = [
  {
    id: "01",
    label: "Receive",
    title: "Global income lands in stablecoins",
    body: "Clients pay in USD, EUR, or USDC. Funds hit your Stellar wallet instantly — no intermediary banks, no correspondent fees.",
    tag: "Stellar Network",
    tagColor: "var(--color-jade)",
    tagBg: "var(--color-jade-light)",
  },
  {
    id: "02",
    label: "Convert",
    title: "Near-zero FX via Stellar DEX",
    body: "Your AI agent swaps at the best on-chain rate across Stellar's liquidity pools. Spread < 0.3%. No spread markup hidden in the rate.",
    tag: "Stellar DEX",
    tagColor: "var(--color-jade)",
    tagBg: "var(--color-jade-light)",
  },
  {
    id: "03",
    label: "Pay",
    title: "INR payouts via regulated ramps",
    body: "Converted INR flows to your bank via Onramp.money or UPI — fully RBI-compliant. UPI QR, NEFT, and IMPS all supported.",
    tag: "Onramp.money",
    tagColor: "var(--color-saffron)",
    tagBg: "var(--color-saffron-light)",
  },
  {
    id: "04",
    label: "Automate",
    title: "AI agent handles the rest",
    body: "Set rules once. The agent pays your bills, EMIs, and UPI merchants automatically. Surplus goes into a safe yield vault.",
    tag: "x402 AI Agent",
    tagColor: "var(--color-saffron)",
    tagBg: "var(--color-saffron-light)",
  },
];

export default function Solution() {
  return (
    <section
      className="section"
      style={{ backgroundColor: "#fff", borderTop: "1px solid var(--color-border)", borderBottom: "1px solid var(--color-border)" }}
    >
      <div className="container-page">
        <p className="text-label" style={{ marginBottom: "16px" }}>The solution</p>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: "24px",
            marginBottom: "64px",
          }}
        >
          <h2
            className="text-display-sm"
            style={{ maxWidth: "480px", color: "var(--color-ink-900)" }}
          >
            One wallet. Four layers of value.
          </h2>
          <p
            style={{
              maxWidth: "380px",
              fontSize: "0.9375rem",
              color: "var(--color-ink-500)",
              lineHeight: 1.7,
              paddingTop: "4px",
            }}
          >
            DeliteX connects the global dollar economy directly to India&apos;s UPI rails,
            with an AI agent sitting in the middle to make every rupee work harder.
          </p>
        </div>

        {/* Flow steps */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
          {steps.map((step, i) => (
            <div
              key={step.id}
              style={{
                display: "grid",
                gridTemplateColumns: "80px 1fr",
                gap: "0 28px",
                paddingTop: "28px",
                paddingBottom: "28px",
                borderTop: i === 0 ? "1px solid var(--color-border)" : "none",
                borderBottom: "1px solid var(--color-border)",
              }}
            >
              {/* Step number */}
              <div style={{ paddingTop: "4px" }}>
                <span
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "2.25rem",
                    color: "var(--color-border)",
                    lineHeight: 1,
                  }}
                >
                  {step.id}
                </span>
              </div>

              {/* Content */}
              <div>
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    alignItems: "center",
                    gap: "12px",
                    marginBottom: "10px",
                  }}
                >
                  <h3
                    style={{
                      fontFamily: "var(--font-body)",
                      fontWeight: 600,
                      fontSize: "1.0625rem",
                      color: "var(--color-ink-900)",
                    }}
                  >
                    {step.title}
                  </h3>
                  <span
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      color: step.tagColor,
                      backgroundColor: step.tagBg,
                      borderRadius: "100px",
                      padding: "3px 10px",
                      letterSpacing: "0.03em",
                    }}
                  >
                    {step.tag}
                  </span>
                </div>
                <p style={{ fontSize: "0.9rem", color: "var(--color-ink-500)", lineHeight: 1.65, maxWidth: "560px" }}>
                  {step.body}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
