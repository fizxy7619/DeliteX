"use client";

import Link from "next/link";
import { useState } from "react";

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        borderBottom: "1px solid var(--color-border)",
        backgroundColor: "var(--color-bg)",
      }}
    >
      <div
        className="container-page"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: "64px",
        }}
      >
        {/* Wordmark */}
        <Link href="/" aria-label="DeliteX home">
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

        {/* Desktop nav */}
        <nav
          style={{
            display: "flex",
            alignItems: "center",
            gap: "32px",
            fontFamily: "var(--font-body)",
            fontSize: "0.875rem",
            fontWeight: 500,
            color: "var(--color-ink-700)",
          }}
          className="hidden md:flex"
        >
          <a href="#how-it-works" style={{ transition: "color 0.15s" }}>How it works</a>
          <a href="#features" style={{ transition: "color 0.15s" }}>Features</a>
          <a href="#faq" style={{ transition: "color 0.15s" }}>FAQ</a>
        </nav>

        {/* CTA */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <Link href="/login" className="hidden md:inline-block" style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--color-ink-700)", transition: "color 0.15s" }}>
            Sign in
          </Link>
          <Link href="/login" className="btn btn-primary hidden md:inline-flex" style={{ padding: "10px 22px", fontSize: "0.875rem" }}>
            Get started
          </Link>
          {/* Mobile hamburger */}
          <button
            onClick={() => setOpen(!open)}
            className="md:hidden"
            aria-label="Toggle menu"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "4px",
              color: "var(--color-ink-700)",
            }}
          >
            {open ? (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <line x1="3" y1="7" x2="21" y2="7" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="17" x2="21" y2="17" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div
          style={{
            borderTop: "1px solid var(--color-border)",
            backgroundColor: "var(--color-bg)",
            padding: "20px 24px 28px",
            display: "flex",
            flexDirection: "column",
            gap: "20px",
          }}
        >
          <a href="#how-it-works" onClick={() => setOpen(false)} style={{ fontSize: "1rem", fontWeight: 500, color: "var(--color-ink-700)" }}>How it works</a>
          <a href="#features" onClick={() => setOpen(false)} style={{ fontSize: "1rem", fontWeight: 500, color: "var(--color-ink-700)" }}>Features</a>
          <a href="#faq" onClick={() => setOpen(false)} style={{ fontSize: "1rem", fontWeight: 500, color: "var(--color-ink-700)" }}>FAQ</a>
          <Link href="/login" onClick={() => setOpen(false)} className="btn btn-primary" style={{ textAlign: "center" }}>Get started</Link>
        </div>
      )}
    </header>
  );
}
