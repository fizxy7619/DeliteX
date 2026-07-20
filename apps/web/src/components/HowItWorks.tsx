"use client";

import React, { useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

const steps = [
  {
    number: "1",
    title: "Connect Income",
    body: "Link Upwork, Stripe, or share your Stellar wallet.",
  },
  {
    number: "2",
    title: "Instant Settlement",
    body: "Funds settle as USDC in seconds.",
  },
  {
    number: "3",
    title: "Agent Allocates",
    body: "Convert to INR, pay bills, and park yield automatically.",
  },
  {
    number: "4",
    title: "Track & Tweak",
    body: "View all history and edit rules in plain language.",
  },
];

function TiltCard({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x, { stiffness: 300, damping: 30 });
  const mouseYSpring = useSpring(y, { stiffness: 300, damping: 30 });

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["12deg", "-12deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-12deg", "12deg"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <div style={{ perspective: "1000px", flex: 1, minWidth: "220px", width: "100%" }}>
      <motion.div
        ref={ref}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          rotateX,
          rotateY,
          transformStyle: "preserve-3d",
          cursor: "default",
          backgroundColor: "rgba(255, 255, 255, 0.05)",
          backdropFilter: "blur(24px) saturate(180%)",
          WebkitBackdropFilter: "blur(24px) saturate(180%)",
          border: "1px solid rgba(255, 255, 255, 0.15)",
          borderRadius: "24px",
          padding: "32px",
          height: "100%",
          boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.2)",
        }}
        whileHover={{
          boxShadow: "0 20px 48px 0 rgba(232, 135, 42, 0.15)",
          borderColor: "rgba(232, 135, 42, 0.3)",
        }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
      >
        <div style={{ transform: "translateZ(40px)", transformStyle: "preserve-3d" }}>
          {children}
        </div>
      </motion.div>
    </div>
  );
}

function HorizontalConnector() {
  return (
    <div className="hidden md:flex items-center justify-center min-w-[30px] w-[5vw] max-w-[60px]">
      <svg width="100%" height="24" viewBox="0 0 100 24" preserveAspectRatio="none" style={{ overflow: "visible" }}>
        <motion.path
          d="M 0,12 L 95,12"
          stroke="var(--color-saffron)"
          strokeWidth="2"
          strokeDasharray="4 8"
          fill="none"
          animate={{ strokeDashoffset: -24 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
        />
        <path d="M 95,7 L 100,12 L 95,17" fill="none" stroke="var(--color-saffron)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

function VerticalConnector() {
  return (
    <div className="flex md:hidden justify-center my-4 w-full">
      <svg width="24" height="40" viewBox="0 0 24 40" style={{ overflow: "visible" }}>
        <motion.path
          d="M 12,0 L 12,35"
          stroke="var(--color-saffron)"
          strokeWidth="2"
          strokeDasharray="4 8"
          fill="none"
          animate={{ strokeDashoffset: -24 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
        />
        <path d="M 7,35 L 12,40 L 17,35" fill="none" stroke="var(--color-saffron)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

export default function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="section"
      style={{
        borderTop: "1px solid rgba(255, 255, 255, 0.15)",
        borderBottom: "1px solid rgba(255, 255, 255, 0.15)",
        position: "relative",
      }}
    >
      <div className="container-page" style={{ position: "relative", zIndex: 2 }}>
        <p className="text-label" style={{ marginBottom: "16px", color: "rgba(255, 255, 255, 0.6)" }}>How it works</p>

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
            style={{ maxWidth: "440px", color: "#fff" }}
          >
            Set it up once. Let the agent run it.
          </h2>
          <p
            style={{
              maxWidth: "360px",
              fontSize: "0.9375rem",
              color: "rgba(255, 255, 255, 0.8)",
              lineHeight: 1.7,
              paddingTop: "4px",
            }}
          >
            No crypto wallets to manage. No manual bank transfers. Just rules
            you write in plain language and an agent that follows them.
          </p>
        </div>

        {/* Pipeline Container */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: "100%",
          }}
          className="md:flex-row md:items-stretch"
        >
          {steps.map((step, i) => (
            <React.Fragment key={step.number}>
              <TiltCard>
                <div
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "3rem",
                    color: "rgba(255, 255, 255, 0.2)",
                    lineHeight: 1,
                    marginBottom: "20px",
                    transform: "translateZ(20px)",
                  }}
                >
                  {step.number}
                </div>
                <h3
                  style={{
                    fontFamily: "var(--font-body)",
                    fontWeight: 600,
                    fontSize: "1.05rem",
                    color: "#ffffff",
                    marginBottom: "12px",
                    lineHeight: 1.4,
                    transform: "translateZ(30px)",
                  }}
                >
                  {step.title}
                </h3>
                <p 
                  style={{ 
                    fontSize: "0.9rem", 
                    color: "rgba(255, 255, 255, 0.7)", 
                    lineHeight: 1.6,
                    transform: "translateZ(20px)",
                  }}
                >
                  {step.body}
                </p>
              </TiltCard>

              {/* Connectors */}
              {i < steps.length - 1 && (
                <>
                  <HorizontalConnector />
                  <VerticalConnector />
                </>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </section>
  );
}
