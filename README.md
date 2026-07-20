# Delite - Agentic Payment OS 🚀

Delite is an Agentic Remittance & Payments OS built for Indian freelancers, NRIs, and their families, on top of the **Stellar + Soroban** stack. It functions as a next-generation "Revolut/Wise + an AI finance assistant", allowing users to receive global income, convert cheaply via Stellar liquidity, and automatically manage splits, bills, and savings.

## 🏆 Stellar Agentic Payments (Levels 1, 2 & 3)

This project has been built to satisfy the requirements of the Stellar Agentic Payments track across all three levels:

### Level 1 (White Belt) - Stellar Fundamentals
- **Wallet Connection**: Full integration with the Freighter wallet on the Stellar Testnet. Users can connect and disconnect securely.
- **Balance Display**: Automatically fetches and displays the connected wallet's XLM balance.
- **Transaction Flow**: Users can send transactions on the Stellar Testnet, with full error handling and UI feedback.
- **Deployed App**: Fully functional and ready for deployment.

### Level 2 (Blue Belt) - Soroban Smart Contracts
- **Custom Smart Contracts**: Contains two deployed Soroban smart contracts (`vault` and `router`) written in Rust.
- **Real Testnet Deployment**: Contracts are natively deployed to the Stellar Testnet, fully optimized via `wasm-opt`.
- **Contract Integration**: The frontend invokes the smart contracts to move testnet XLM programmatically based on user actions.

### Level 3 (Black Belt) - Agentic Workflows
- **Autonomous Agent Logic**: The Router contract acts as an automated agent, receiving incoming funds and programmatically splitting them into remittance and savings streams.
- **Yield Generation**: The Vault contract functions similarly to an ERC-4626 vault, holding surplus funds.
- **Seamless UI**: Users trigger complex agentic allocations with a single click, abstracting away the blockchain complexity.

---

## 📸 Screenshots

*(Replace the placeholders below with actual screenshots of your application)*

### 1. Dashboard & Wallet Connection
![Dashboard Placeholder](placeholder-dashboard.png)
*Description: The main dashboard showing wallet connection and testnet XLM balance.*

### 2. Agent Allocation Flow
![Allocation Flow Placeholder](placeholder-allocation.png)
*Description: Triggering the smart contract router to split incoming payments.*

### 3. Transaction Success (Stellar Explorer)
![Transaction Placeholder](placeholder-transaction.png)
*Description: Verifying the on-chain testnet transaction.*

---

## 🛠 Tech Stack

- **Frontend**: Next.js (React), Tailwind CSS, TypeScript
- **Wallet Integration**: `@stellar/stellar-sdk`, `@stellar/freighter-api`
- **Smart Contracts**: Rust, Soroban SDK
- **Deployment**: Node.js scripts for automated Testnet deployment

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- `pnpm` (or `npm`/`yarn`)
- [Freighter Wallet](https://www.freighter.app/) browser extension
- Rust & Soroban CLI (for local contract compilation)

### Installation & Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/delite.git
   cd delite
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up Environment Variables**
   The deployment script automatically manages contract addresses, but ensure your `apps/web/.env.local` contains the testnet contract IDs:
   ```env
   NEXT_PUBLIC_SOROBAN_VAULT="CBHHUKU65XWOJYXEXBJHU7PJOZEWG2AOGKZ56ASPU3OG7FXEZCQMT45O"
   NEXT_PUBLIC_SOROBAN_ROUTER="CCEQR6MONDFSUYHSIJU5QMKWVJKT3WMGBV32NHWAR766TIUYBN2B6CEK"
   ```

4. **Run the Development Server**
   ```bash
   pnpm dev
   ```
   Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 📜 Smart Contracts

The Soroban contracts are located in `packages/contracts`. 
To recompile and deploy them to the Stellar Testnet:

```bash
cd packages/contracts
pnpm run build
node scripts/deploy.js
```
*Note: Ensure your `deploy.js` script handles testnet Friendbot funding and deployer keypair generation as configured.*

---

## 🤝 Contributing
Contributions, issues, and feature requests are welcome!

## 📄 License
This project is licensed under the MIT License.
