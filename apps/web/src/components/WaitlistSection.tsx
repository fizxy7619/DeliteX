import WaitlistForm from "./WaitlistForm";

export default function WaitlistSection() {
  return (
    <section
      id="waitlist"
      className="section"
      style={{ borderTop: "1px solid var(--color-ink-700)",
      }}
    >
      <div className="container-page">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "80px",
            alignItems: "center",
          }}
          className="waitlist-grid"
        >
          {/* Left: copy */}
          <div>
            <p
              style={{
                fontSize: "0.6875rem",
                fontWeight: 600,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "var(--color-saffron)",
                marginBottom: "20px",
              }}
            >
              Early access
            </p>
            <h2
              className="text-display-sm"
              style={{ color: "#fff", marginBottom: "20px" }}
            >
              Be the first to use DeliteX.
            </h2>
            <p
              style={{
                fontSize: "0.9375rem",
                color: "rgba(255,255,255,0.55)",
                lineHeight: 1.7,
                marginBottom: "32px",
              }}
            >
              We are onboarding Indian freelancers, NRIs, and their families in
              small batches. Join the list to get priority access, influence the
              product roadmap, and lock in founding-member pricing.
            </p>

            {/* Bullet promises */}
            <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "12px" }}>
              {[
                "Priority onboarding — skip the queue",
                "Founding-member fee cap for the first year",
                "Direct access to the team for feedback",
              ].map((item) => (
                <li
                  key={item}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    fontSize: "0.875rem",
                    color: "rgba(255,255,255,0.7)",
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-saffron)" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Right: form */}
          <div
            style={{ border: "1px solid var(--color-border)",
              borderRadius: "16px",
              padding: "40px",
            }}
          >
            <h3
              style={{
                fontFamily: "var(--font-body)",
                fontWeight: 600,
                fontSize: "1.0625rem",
                color: "var(--color-ink-900)",
                marginBottom: "8px",
              }}
            >
              Request early access
            </h3>
            <p
              style={{
                fontSize: "0.875rem",
                color: "var(--color-ink-500)",
                marginBottom: "28px",
              }}
            >
              Takes 30 seconds. No credit card required.
            </p>
            <WaitlistForm />
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .waitlist-grid {
            grid-template-columns: 1fr !important;
            gap: 40px !important;
          }
        }
      `}</style>
    </section>
  );
}
