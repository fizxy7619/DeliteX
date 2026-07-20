import Link from "next/link";

export default function Hero() {
  return (
    <section
      style={{
        paddingTop: "clamp(120px, 12vw, 160px)",
        paddingBottom: "clamp(72px, 10vw, 120px)",
        borderBottom: "1px solid rgba(255, 255, 255, 0.15)",
      }}
    >
      <div className="container-page">
        <div style={{ maxWidth: "760px" }}>
          {/* Pill label */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              backgroundColor: "rgba(232, 135, 42, 0.15)",
              border: "1px solid rgba(232,135,42,0.3)",
              borderRadius: "100px",
              padding: "6px 14px",
              marginBottom: "32px",
            }}
          >
            <span
              style={{
                width: "7px",
                height: "7px",
                borderRadius: "50%",
                backgroundColor: "var(--color-saffron)",
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "0.8125rem",
                fontWeight: 600,
                color: "var(--color-saffron)",
                letterSpacing: "0.04em",
              }}
            >
              Now accepting early access applications
            </span>
          </div>

          {/* Headline */}
          <h1
            className="text-display animate-fade-up"
            style={{ marginBottom: "24px", color: "#ffffff" }}
          >
            An agentic wallet for{" "}
            <em style={{ fontStyle: "italic", color: "var(--color-saffron)" }}>
              global income
            </em>{" "}
            <br className="hidden md:block" />
            and{" "}
            <em style={{ fontStyle: "italic" }}>local life</em>{" "}
            in India.
          </h1>

          {/* Subheadline */}
          <p
            className="animate-fade-up delay-100"
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "clamp(1.0625rem, 2vw, 1.2rem)",
              color: "rgba(255, 255, 255, 0.8)",
              lineHeight: 1.65,
              maxWidth: "640px",
              marginBottom: "48px",
            }}
          >
            Indian freelancers and NRIs lose 5–7% every time they move money.
            DeliteX settles global income on Stellar in seconds, converts at
            near‑zero cost, and lets an AI agent handle your bills, UPI merchants,
            and savings — automatically.
          </p>

          {/* CTAs */}
          <div
            className="animate-fade-up delay-200"
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "12px",
              marginBottom: "64px",
            }}
          >
            <Link href="/login" className="btn btn-saffron btn-large" style={{ borderRadius: "100px" }}>
              Get started
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
            <a href="#how-it-works" className="btn btn-ghost btn-large" style={{ color: "white", borderColor: "rgba(255,255,255,0.2)", borderRadius: "100px" }}>
              See how it works
            </a>
          </div>

          {/* Trust micro-bar */}
          <div
            className="animate-fade-up delay-300"
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "24px",
              paddingTop: "32px",
              borderTop: "1px solid rgba(255, 255, 255, 0.15)",
            }}
          >
            {[
              { value: "< 10 sec", label: "Settlement time" },
              { value: "< 0.5%", label: "FX + network fees" },
              { value: "₹0 fee", label: "UPI bill payments" },
            ].map((stat) => (
              <div key={stat.label}>
                <p
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "1.75rem",
                    color: "#ffffff",
                    lineHeight: 1.2,
                  }}
                >
                  {stat.value}
                </p>
                <p
                  style={{
                    fontSize: "0.875rem",
                    color: "rgba(255, 255, 255, 0.6)",
                    fontWeight: 500,
                    marginTop: "4px",
                  }}
                >
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
