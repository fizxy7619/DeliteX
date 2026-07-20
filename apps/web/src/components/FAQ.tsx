"use client";

import { useState } from "react";

const faqs = [
  {
    q: "Is this compliant with RBI and FEMA regulations?",
    a: "Yes. INR payouts are processed exclusively through RBI-licensed payment partners (such as Onramp.money). All international transfers follow FEMA guidelines. DeliteX is designed so you never touch raw crypto — you send or receive rupees, dollars, or euros. The Stellar layer is infrastructure, not an unregulated side channel.",
  },
  {
    q: "Do I need any crypto knowledge to use DeliteX?",
    a: "None. You interact with rupees, dollars, and bank accounts — just like Wise or Revolut. The Stellar wallet, private keys, and on-chain mechanics are managed securely by the platform. You can optionally connect a self-custody wallet (Freighter/Albedo) if you want direct control.",
  },
  {
    q: "How are my funds protected?",
    a: "Customer stablecoin balances are held in segregated Stellar accounts. INR earmarked for payouts are moved immediately to licensed custodians. Yield strategies use audited Soroban vault contracts with withdrawal delays and risk parameters you can inspect. No fractional-reserve lending.",
  },
  {
    q: "What countries can send me money through DeliteX?",
    a: "Any country where Stellar payments or USDC/EURC transfers are accessible — which covers the US, EU, UK, Canada, UAE, Australia, and most of Southeast Asia. We are expanding bank-to-wallet integrations progressively.",
  },
  {
    q: "What are the actual fees?",
    a: "Stellar network fees are fractions of a cent. FX spreads on the DEX are typically 0.1–0.3%. Our on/off-ramp partners charge 0.5–1% for INR conversion. Total cost-of-transfer targets under 1%, compared to 3–7% for wire + bank FX. We publish a full fee schedule before launch.",
  },
  {
    q: "When is DeliteX launching?",
    a: "We are in private beta. Join the waitlist to get early access, shape the feature roadmap, and receive priority onboarding when we open doors.",
  },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div
      style={{
        borderBottom: "1px solid var(--color-border)",
        padding: "0",
      }}
    >
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "16px",
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: "24px 0",
          textAlign: "left",
        }}
        aria-expanded={open}
      >
        <span
          style={{
            fontFamily: "var(--font-body)",
            fontWeight: 500,
            fontSize: "0.9375rem",
            color: "var(--color-ink-900)",
            lineHeight: 1.5,
          }}
        >
          {q}
        </span>
        <span
          style={{
            flexShrink: 0,
            width: "24px",
            height: "24px",
            borderRadius: "50%",
            border: "1.5px solid var(--color-border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--color-ink-700)",
            transition: "transform 0.2s ease",
            transform: open ? "rotate(45deg)" : "none",
          }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="6" y1="0" x2="6" y2="12" />
            <line x1="0" y1="6" x2="12" y2="6" />
          </svg>
        </span>
      </button>

      {open && (
        <div
          style={{
            paddingBottom: "24px",
            fontSize: "0.9rem",
            color: "var(--color-ink-500)",
            lineHeight: 1.7,
            maxWidth: "680px",
          }}
        >
          {a}
        </div>
      )}
    </div>
  );
}

export default function FAQ() {
  return (
    <section
      id="faq"
      className="section"
      style={{ backgroundColor: "#fff", borderTop: "1px solid var(--color-border)" }}
    >
      <div className="container-page">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 2fr",
            gap: "80px",
            alignItems: "start",
          }}
          className="faq-grid"
        >
          <div style={{ position: "sticky", top: "90px" }}>
            <p className="text-label" style={{ marginBottom: "16px" }}>FAQ</p>
            <h2
              className="text-display-sm"
              style={{ color: "var(--color-ink-900)", marginBottom: "20px" }}
            >
              Common questions.
            </h2>
            <p style={{ fontSize: "0.9rem", color: "var(--color-ink-500)", lineHeight: 1.65 }}>
              Can&rsquo;t find the answer? Email us at{" "}
              <a
                href="mailto:hello@delitex.app"
                style={{ color: "var(--color-saffron)", textDecoration: "underline" }}
              >
                hello@delitex.app
              </a>
            </p>
          </div>

          <div>
            {faqs.map((faq) => (
              <FAQItem key={faq.q} q={faq.q} a={faq.a} />
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .faq-grid {
            grid-template-columns: 1fr !important;
            gap: 40px !important;
          }
          .faq-grid > div:first-child {
            position: static !important;
          }
        }
      `}</style>
    </section>
  );
}
