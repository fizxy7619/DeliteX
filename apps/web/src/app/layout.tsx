import type { Metadata } from "next";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "DeliteX — Agentic Wallet for Global Income & Indian Life",
  description:
    "Get paid globally in seconds, pay Indian bills automatically, and let an AI agent manage your FX, UPI, and savings. Built on Stellar + Soroban for Indian freelancers and NRIs.",
  keywords: [
    "remittance India",
    "NRI payments",
    "Stellar wallet",
    "UPI automation",
    "freelancer payments",
    "stablecoin India",
    "AI finance agent",
  ],
  openGraph: {
    title: "DeliteX — Agentic Wallet for Global Income & Indian Life",
    description:
      "Cheap FX. Fast settlements. AI-managed Indian bill payments. Built for Indian freelancers and NRIs.",
    type: "website",
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
    title: "DeliteX — Agentic Wallet for Global Income & Indian Life",
    description:
      "Cheap FX. Fast settlements. AI-managed Indian bill payments.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <head>
        {/* Preconnect for Google Fonts — loaded in globals.css */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
      </head>
      <body className="min-h-full flex flex-col">
        {children}
        <Toaster position="bottom-right" richColors />
      </body>
    </html>
  );
}
