// SocialProof section — stubbed with placeholder logos and testimonials.
// TODO: Replace with real partner logos and testimonials when available.

const stats = [
  { value: "$0", label: "raised (pre-seed)" },
  { value: "500+", label: "early access applications" },
  { value: "3–5s", label: "Stellar settlement time" },
  { value: "< 0.3%", label: "average FX spread" },
];

const logoPlaceholders = [
  "Stellar Development Foundation",
  "Onramp.money",
  "Soroban",
  "x402 Protocol",
];

const testimonials = [
  {
    quote:
      "I've been losing 6–7% on every Upwork payout for three years. If DeliteX can get that under 1%, it's a no-brainer.",
    author: "Priya M.",
    role: "Senior UI/UX Designer, Bangalore",
  },
  {
    quote:
      "Managing money between the US and my family in India is exhausting. An AI that just handles it automatically sounds like a dream.",
    author: "Arjun K.",
    role: "Software Engineer, Bay Area (NRI)",
  },
];

export default function SocialProof() {
  return (
    <section
      className="section"
      style={{ borderBottom: "1px solid var(--color-border)" }}
    >
      <div className="container-page">
        {/* Stats row */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: "1px",
            border: "1px solid var(--color-border)",
            borderRadius: "12px",
            overflow: "hidden",
            backgroundColor: "var(--color-border)",
            marginBottom: "80px",
          }}
        >
          {stats.map((s) => (
            <div
              key={s.label}
              style={{
                backgroundColor: "var(--color-bg-card)",
                padding: "32px 28px",
                textAlign: "center",
              }}
            >
              <p
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "2.5rem",
                  color: "var(--color-ink-900)",
                  lineHeight: 1.1,
                  marginBottom: "8px",
                }}
              >
                {s.value}
              </p>
              <p style={{ fontSize: "0.8125rem", color: "var(--color-ink-500)", fontWeight: 500 }}>
                {s.label}
              </p>
            </div>
          ))}
        </div>

        {/* Partners */}
        <p className="text-label" style={{ marginBottom: "24px", textAlign: "center" }}>
          Built on trusted infrastructure
        </p>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: "12px",
            marginBottom: "80px",
          }}
        >
          {logoPlaceholders.map((name) => (
            <div
              key={name}
              style={{
                border: "1px solid var(--color-border)",
                borderRadius: "8px",
                padding: "14px 24px",
                fontSize: "0.875rem",
                fontWeight: 600,
                color: "var(--color-ink-500)",
                letterSpacing: "0.01em",
              }}
            >
              {/* TODO: Replace with actual SVG partner logos */}
              {name}
            </div>
          ))}
        </div>

        {/* Testimonials */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "20px",
          }}
        >
          {testimonials.map((t) => (
            <div
              key={t.author}
              className="card"
              style={{ display: "flex", flexDirection: "column", gap: "20px" }}
            >
              {/* Quote mark */}
              <svg width="28" height="20" viewBox="0 0 36 26" fill="none" aria-hidden="true">
                <path
                  d="M0 26V17.333C0 11.481 2.667 6.556 8 2.556L10.667 0l2.666 2.556C9.778 6 8 9.963 8 14.444H14.667V26H0zm21.333 0V17.333C21.333 11.481 24 6.556 29.333 2.556L32 0l2.667 2.556C31.111 6 29.333 9.963 29.333 14.444H36V26H21.333z"
                  fill="var(--color-border)"
                />
              </svg>
              <p
                style={{
                  fontSize: "0.9375rem",
                  color: "var(--color-ink-700)",
                  lineHeight: 1.65,
                  fontStyle: "italic",
                }}
              >
                &ldquo;{t.quote}&rdquo;
              </p>
              <div>
                <p style={{ fontWeight: 600, fontSize: "0.875rem", color: "var(--color-ink-900)" }}>
                  {t.author}
                </p>
                <p style={{ fontSize: "0.8125rem", color: "var(--color-ink-500)", marginTop: "2px" }}>
                  {t.role}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
