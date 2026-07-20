import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "DeliteX Demo — Agentic Remittance & Payments OS",
  description: "Live interactive demo of DeliteX — the AI-powered financial OS for Indian freelancers. See how payments are received, allocated, and executed automatically.",
};

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
