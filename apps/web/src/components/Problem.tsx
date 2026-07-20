const pains = [
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        <path d="M12 2v20M2 12h20" />
        <circle cx="12" cy="12" r="10" />
      </svg>
    ),
    headline: "3–7% eaten in fees",
    body: "Every wire, PayPal transfer, or Wise payment takes a slice. On ₹10 lakh a year, that's ₹30,000–70,000 gone.",
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
    headline: "2–5 days to settle",
    body: "SWIFT wires, intermediary banks, and cut-off windows mean funds arrive days after the work is done — or don't arrive at all.",
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        <rect x="2" y="3" width="20" height="18" rx="2" /><line x1="8" y1="10" x2="16" y2="10" /><line x1="8" y1="14" x2="12" y2="14" />
      </svg>
    ),
    headline: "Five apps, zero automation",
    body: "Freelancers juggle separate tools for invoicing, FX, UPI, savings, and tax. Nothing talks to anything else.",
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
    headline: "NRI compliance maze",
    body: "FEMA rules, TDS on remittances, NRE vs NRO accounts — every decision is a potential compliance trap.",
  },
];

export default function Problem() {
  return (
    <section className="section" style={{ }}>
      <div className="container-page">
        {/* Section label */}
        <p className="text-label" style={{ marginBottom: "16px" }}>The problem</p>

        <h2
          className="text-display-sm"
          style={{ maxWidth: "520px", marginBottom: "56px", color: "var(--color-ink-900)" }}
        >
          Moving money to India is still{" "}
          <span style={{ color: "var(--color-saffron)" }}>broken.</span>
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "20px",
          }}
        >
          {pains.map((item) => (
            <div key={item.headline} className="problem-card-wrapper">
              {/* The glowing animated border that appears on hover */}
              <div className="problem-card-border" />
              
              {/* The actual card content */}
              <div
                className="problem-card-content"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "14px",
                }}
              >
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "8px",
                    backgroundColor: "var(--color-saffron-light)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--color-saffron)",
                    flexShrink: 0,
                  }}
                >
                  {item.icon}
                </div>
                <div>
                  <h3
                    style={{
                      fontFamily: "var(--font-body)",
                      fontWeight: 600,
                      fontSize: "1rem",
                      color: "var(--color-ink-900)",
                      marginBottom: "6px",
                    }}
                  >
                    {item.headline}
                  </h3>
                  <p style={{ fontSize: "0.9rem", color: "var(--color-ink-500)", lineHeight: 1.6 }}>
                    {item.body}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
