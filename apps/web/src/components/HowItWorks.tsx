const steps = [
  {
    number: "1",
    title: "Connect your income source",
    body: "Link your Upwork, Toptal, Stripe, or any invoice client. Alternatively, share your Stellar wallet address — payments arrive directly.",
  },
  {
    number: "2",
    title: "Receive funds to your Stellar wallet",
    body: "Payments settle on Stellar in seconds as USDC or EURC. You get a notification the moment funds land.",
  },
  {
    number: "3",
    title: "AI agent allocates and pays",
    body: "Your configured rules kick in automatically: convert to INR, pay rent, top up UPI, and park the surplus in yield — no manual steps.",
  },
  {
    number: "4",
    title: "Track and adjust your rules anytime",
    body: "Your dashboard shows every transaction, allocation, and yield position. Edit rules in plain language and the agent updates immediately.",
  },
];

export default function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="section"
      style={{
        backgroundColor: "#fff",
        borderTop: "1px solid var(--color-border)",
        borderBottom: "1px solid var(--color-border)",
      }}
    >
      <div className="container-page">
        <p className="text-label" style={{ marginBottom: "16px" }}>How it works</p>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-between",
            gap: "24px",
            marginBottom: "64px",
          }}
        >
          <h2
            className="text-display-sm"
            style={{ maxWidth: "440px" }}
          >
            Set it up once. Let the agent run it.
          </h2>
          <p
            style={{
              maxWidth: "360px",
              fontSize: "0.9375rem",
              color: "var(--color-ink-500)",
              lineHeight: 1.7,
              paddingTop: "4px",
            }}
          >
            No crypto wallets to manage. No manual bank transfers. Just rules
            you write in plain language and an agent that follows them.
          </p>
        </div>

        {/* Steps */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "0",
            border: "1px solid var(--color-border)",
            borderRadius: "12px",
            overflow: "hidden",
          }}
        >
          {steps.map((step, i) => (
            <div
              key={step.number}
              style={{
                padding: "32px 28px",
                borderRight: i < steps.length - 1 ? "1px solid var(--color-border)" : "none",
                position: "relative",
              }}
            >
              <div
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "3rem",
                  color: "var(--color-border)",
                  lineHeight: 1,
                  marginBottom: "20px",
                }}
              >
                {step.number}
              </div>
              <h3
                style={{
                  fontFamily: "var(--font-body)",
                  fontWeight: 600,
                  fontSize: "0.9375rem",
                  color: "var(--color-ink-900)",
                  marginBottom: "10px",
                  lineHeight: 1.4,
                }}
              >
                {step.title}
              </h3>
              <p style={{ fontSize: "0.875rem", color: "var(--color-ink-500)", lineHeight: 1.65 }}>
                {step.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
