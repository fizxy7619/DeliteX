"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header
      style={{
        position: "absolute",
        top: "24px",
        left: "50%",
        transform: "translateX(-50%)",
        width: "calc(100% - 48px)",
        maxWidth: "1200px",
        zIndex: 50,
        backgroundColor: "rgba(255, 255, 255, 0.05)",
        backdropFilter: "blur(24px) saturate(180%)",
        WebkitBackdropFilter: "blur(24px) saturate(180%)",
        border: "1px solid rgba(255, 255, 255, 0.15)",
        borderRadius: "100px",
        boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.2)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: "64px",
          padding: "0 24px",
        }}
      >
        {/* Wordmark */}
        <Link href="/" aria-label="DeliteX home" style={{ display: "flex", alignItems: "center" }}>
          <Image 
            src="/images/logo_transparent.png" 
            alt="DeliteX" 
            width={120}
            height={36}
            style={{ 
              height: "36px", 
              width: "auto",
              objectFit: "contain"
            }} 
          />
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
            color: "rgba(255, 255, 255, 0.8)",
          }}
          className="hidden md:flex"
        >
          <a href="#how-it-works" style={{ transition: "color 0.15s" }} className="hover:text-white">How it works</a>
          <a href="#features" style={{ transition: "color 0.15s" }} className="hover:text-white">Features</a>
          <a href="#faq" style={{ transition: "color 0.15s" }} className="hover:text-white">FAQ</a>
        </nav>

        {/* CTA */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <Link href="/login" className="hidden md:inline-block" style={{ fontSize: "0.875rem", fontWeight: 500, color: "#ffffff", transition: "color 0.15s" }}>
            Sign in
          </Link>
          <Link href="/login" className="btn btn-saffron hidden md:inline-flex" style={{ padding: "10px 22px", fontSize: "0.875rem", borderRadius: "100px" }}>
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
              color: "#ffffff",
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
            borderTop: "1px solid rgba(255, 255, 255, 0.15)",
            backgroundColor: "rgba(10, 15, 20, 0.85)",
            backdropFilter: "blur(24px) saturate(180%)",
            padding: "20px 24px 28px",
            display: "flex",
            flexDirection: "column",
            gap: "20px",
            borderRadius: "0 0 24px 24px",
          }}
        >
          <a href="#how-it-works" onClick={() => setOpen(false)} style={{ fontSize: "1rem", fontWeight: 500, color: "#ffffff" }}>How it works</a>
          <a href="#features" onClick={() => setOpen(false)} style={{ fontSize: "1rem", fontWeight: 500, color: "#ffffff" }}>Features</a>
          <a href="#faq" onClick={() => setOpen(false)} style={{ fontSize: "1rem", fontWeight: 500, color: "#ffffff" }}>FAQ</a>
          <Link href="/login" onClick={() => setOpen(false)} className="btn btn-saffron" style={{ textAlign: "center" }}>Get started</Link>
        </div>
      )}
    </header>
  );
}

