"use client";

import Link from "next/link";

const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

export default function DemoBar() {
  if (!isDemoMode) return null;

  return (
    <div
      role="banner"
      aria-label="Demo mode indicator"
      style={{
        position: "sticky",
        top: 0,
        zIndex: 100,
        width: "100%",
        background: "linear-gradient(90deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
        borderBottom: "1px solid rgba(255,255,255,0.1)",
        padding: "9px 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "12px",
        flexWrap: "wrap",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
            padding: "3px 10px",
            borderRadius: "100px",
            backgroundColor: "rgba(255,200,0,0.15)",
            border: "1px solid rgba(255,200,0,0.3)",
            fontSize: "0.7rem",
            fontWeight: 700,
            color: "#FFD700",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
          }}
        >
          🎭 Demo Mode
        </span>
        <p style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,0.7)" }}>
          All data is simulated · No real funds involved · Stellar testnet
        </p>
      </div>
      <Link
        href="/#waitlist"
        style={{
          padding: "6px 16px",
          borderRadius: "8px",
          backgroundColor: "var(--color-saffron)",
          color: "#fff",
          fontSize: "0.8125rem",
          fontWeight: 700,
          textDecoration: "none",
          flexShrink: 0,
          transition: "opacity 0.15s",
        }}
      >
        Request Early Access →
      </Link>
    </div>
  );
}
