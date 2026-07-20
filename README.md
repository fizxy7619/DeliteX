# DeliteX (AgentWallet)

**Value Proposition:** An Agentic Remittance & Payments OS for Indian freelancers, NRIs, and their families, on top of the Stellar + Soroban stack. "Revolut/Wise + an AI finance assistant" tuned specifically for India.

## High-Level Architecture

DeliteX is built as a monorepo consisting of:
- **Frontend (`apps/web`)**: Next.js application (React, TailwindCSS) providing a modern, clean, minimal UI.
- **Backend**: Supabase for database, authentication, and edge functions.
- **Blockchain (`packages/contracts`)**: Stellar + Soroban smart contracts for cheap conversion, yield layer, and x402 agentic payments.
- **Shared Libraries**: 
  - `packages/ui`: Shared React components.
  - `packages/config-*`: Shared TypeScript and ESLint configurations.

## Development Setup

1. **Install Dependencies:**
   ```bash
   pnpm install
   ```

2. **Environment Variables:**
   Copy `.env.example` to `.env.local` (or `.env` in respective packages) and fill in the values.
   ```bash
   cp .env.example .env.local
   ```

3. **Start Development Server:**
   ```bash
   pnpm run dev
   ```

## Design Style

- Modern, clean, minimal UI. No color gradients.
- Restrained color palette (off-white background, primary accent color, secondary accent color, neutral grays).
- Distinctive typography using out-of-the-box Google Fonts.
- Responsive, mobile-first layouts with clear hierarchy and white space.

## Phase 0 Delivery
- Clean Turborepo layout.
- Base configurations (TypeScript, ESLint, Prettier).
- Continuous Integration pipeline via GitHub Actions.
