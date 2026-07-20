import Link from "next/link";

const links = {
  Product: [
    { label: "How it works", href: "#how-it-works" },
    { label: "Features", href: "#features" },
    { label: "FAQ", href: "#faq" },
    { label: "Pricing", href: "#" },
  ],
  Company: [
    { label: "About", href: "#" },
    { label: "Blog", href: "#" },
    { label: "Careers", href: "#" },
    { label: "Contact", href: "mailto:hello@delitex.app" },
  ],
  Legal: [
    { label: "Privacy policy", href: "/privacy" },
    { label: "Terms of service", href: "/terms" },
    { label: "Cookie policy", href: "/cookies" },
  ],
  Developers: [
    { label: "Documentation", href: "#" },
    { label: "Stellar SDK", href: "https://stellar.org/developers", target: "_blank" },
    { label: "Soroban", href: "https://soroban.stellar.org", target: "_blank" },
    { label: "GitHub", href: "#" },
  ],
};

export default function Footer() {
  return (
    <footer
      style={{
        backgroundColor: "var(--color-bg)",
        borderTop: "1px solid var(--color-border)",
        paddingTop: "64px",
        paddingBottom: "40px",
      }}
    >
      <div className="container-page">
        {/* Top: wordmark + links */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "200px repeat(4, 1fr)",
            gap: "40px",
            marginBottom: "64px",
          }}
          className="footer-grid"
        >
          {/* Wordmark col */}
          <div>
            <Link href="/" style={{ display: "inline-block", marginBottom: "12px" }}>
              <span
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "1.375rem",
                  color: "var(--color-ink-900)",
                  letterSpacing: "-0.02em",
                }}
              >
                Delite<span style={{ color: "var(--color-saffron)" }}>X</span>
              </span>
            </Link>
            <p
              style={{
                fontSize: "0.8125rem",
                color: "var(--color-ink-500)",
                lineHeight: 1.65,
                maxWidth: "160px",
              }}
            >
              Agentic remittance & payments OS for Indian freelancers and NRIs.
            </p>
          </div>

          {/* Link columns */}
          {Object.entries(links).map(([category, items]) => (
            <div key={category}>
              <p
                style={{
                  fontSize: "0.6875rem",
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "var(--color-ink-900)",
                  marginBottom: "16px",
                }}
              >
                {category}
              </p>
              <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "10px" }}>
                {items.map((item) => (
                  <li key={item.label}>
                    <a
                      href={item.href}
                      target={"target" in item ? item.target : undefined}
                      rel={"target" in item ? "noopener noreferrer" : undefined}
                      className="footer-link"
                      style={{
                        fontSize: "0.875rem",
                        transition: "color 0.15s",
                      }}
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <hr className="divider" style={{ marginBottom: "28px" }} />

        {/* Bottom bar */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <p style={{ fontSize: "0.8125rem", color: "var(--color-ink-500)" }}>
            © {new Date().getFullYear()} DeliteX Technologies Pvt. Ltd. All rights reserved.
          </p>
          <p style={{ fontSize: "0.8125rem", color: "var(--color-ink-300)" }}>
            Built on{" "}
            <a href="https://stellar.org" target="_blank" rel="noopener noreferrer" style={{ color: "var(--color-ink-500)" }}>
              Stellar
            </a>{" "}
            ·{" "}
            <a href="https://soroban.stellar.org" target="_blank" rel="noopener noreferrer" style={{ color: "var(--color-ink-500)" }}>
              Soroban
            </a>
          </p>
        </div>
      </div>

      <style>{`
        .footer-link { color: var(--color-ink-500); }
        .footer-link:hover { color: var(--color-ink-900); }
        @media (max-width: 768px) {
          .footer-grid {
            grid-template-columns: 1fr 1fr !important;
            gap: 32px !important;
          }
        }
        @media (max-width: 480px) {
          .footer-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </footer>
  );
}
