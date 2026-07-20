# Onramp.money Production Integration Guide

This document outlines how the DeliteX on/off-ramp integration transitions from its current testnet/stub state to a production-ready environment using Onramp.money.

## 1. Architecture & Compliance

DeliteX uses Onramp.money as its regulated FIAT gateway for India. By routing through Onramp.money, DeliteX itself does not touch fiat funds or hold custody of INR, relying on Onramp's PPI license and KYC/AML procedures.

**Flow (USDC → INR):**
1. User receives USDC on Stellar.
2. AI Agent (or User) initiates payout to a family member or biller via DeliteX.
3. DeliteX sends a `POST /payouts` API call to Onramp.money.
4. Onramp.money locks in an exchange rate and gives a Stellar deposit address.
5. DeliteX Router Contract (or user wallet) sends USDC to the Onramp.money Stellar address.
6. Onramp.money executes the UPI/IMPS transfer to the recipient's bank account.
7. Onramp.money triggers a webhook (`/api/onramp/webhook`) confirming `payout.completed`.

## 2. Environment Requirements

To move to production, the following environments and credentials must be established:

### A. API Keys
Obtain Production API keys from the Onramp.money Merchant Dashboard:
- `ONRAMP_API_KEY`: Used in `X-Api-Key` headers.
- `ONRAMP_API_SECRET`: Used in `X-Api-Secret` headers.
- `ONRAMP_WEBHOOK_SECRET`: Used to verify `X-Onramp-Signature` on incoming webhooks via HMAC-SHA256.

### B. Whitelisting
- DeliteX production server IP addresses must be whitelisted in the Onramp.money dashboard.
- The `https://app.delitex.com/api/onramp/webhook` URL must be registered.

### C. Test Environment Transition
During development, we use `STUB_MODE = true` in `src/lib/onramp/connector.ts`.
Before full production, this should be tested against Onramp's **Sandbox Environment** (using their sandbox base URL and test UPI VPAs that always succeed/fail based on amount).
Once verified, change `ONRAMP_BASE_URL` to `https://api.onramp.money/v1`.

## 3. Webhook Handling

The webhook handler (`src/app/api/onramp/webhook/route.ts`) is critical for reconciling state.
In production:
- Every payout request creates an `onramp_transactions` row with status `pending`.
- The webhook updates this to `processing`, `completed`, or `failed`.
- The webhook must verify the HMAC-SHA256 signature using `ONRAMP_WEBHOOK_SECRET` to prevent spoofing.
- If a payout fails, the AI Agent must be notified to retry or alert the user.

## 4. KYC & Limits

In production, Onramp.money enforces KYC limits.
- **Tier 1**: Up to ₹50,000 / month (Basic KYC).
- **Tier 2**: Up to ₹5,00,000 / month (Full KYC).
DeliteX must sync the user's `kycStatus` in the `user_profiles` table. If a payout exceeds the user's limit, the Onramp API will return a `422 Unprocessable Entity` which DeliteX must gracefully handle by asking the user to upgrade their KYC tier.
