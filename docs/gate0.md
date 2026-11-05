# Gate 0 Reality Check: Telegraph Protocol Integration

**Date**: November 2026  
**Status**: Verified & Configured  
**Hackathon Fit**: Telegraph Season II, Track 03 (Apps & Agents), Mission 09 (Personal Agent)

---

## 1. Network & Chain Parameters

| Parameter | Value | Verification Status |
|-----------|-------|---------------------|
| Chain Name | Ethereum Sepolia Testnet | Confirmed per Bounty Tracker |
| Chain ID | `11155111` | Enforced by Viem Chain Guard |
| Telegraph Contract | `0x3624EB012B5E998BB57B6bE6C9Cfc9c4bc5eb99b` | Configured in `.env.example` |
| Settlement Token | USDC (Testnet) `0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238` | Configured in `.env.example` |
| RPC Transport | JSON-RPC over HTTPS (`SEPOLIA_RPC_URL`) | Verified with Viem Client |

> **Warning regarding Base Sepolia:** The older documentation and registration button on `integrate.telegraphprotocol.com` referenced Base Sepolia. For Season II, all deployments and miner settlements operate exclusively on **Ethereum Sepolia (Chain ID: 11155111)**.

---

## 2. Target Intent Schemas & Miner Availability

Three mandatory intents from the Season II list have been mapped with strict Zod validators:

1. **`FX_NOW`**
   - Parameters: `{ pair: "EUR/USD" }`
   - Answer: `{ pair: string, rate: number, timestamp: number }`
   - Default Conservative Window: 300s (5 minutes)
2. **`WEATHER_FORECAST_VERIFY`**
   - Parameters: `{ location: "London" }`
   - Answer: `{ location: string, temperatureC: number, condition: string, forecastTimestamp: number }`
   - Default Conservative Window: 3600s (1 hour)
3. **`SANCTIONS_SCREENING_MATCH`**
   - Parameters: `{ entity: "Acme International" }`
   - Answer: `{ entity: string, matched: boolean, matchScore: number, listName?: string }`
   - Default Conservative Window: 86400s (24 hours)

---

## 3. Cryptographic & Security Safeguards Verified

- **Zero Unlimited Approvals**: The Chain Guard explicitly rejects any token approval with `MAX_UINT256` or exceeding the exact transaction cost.
- **Envelope Encryption**: Wallet private keys are encrypted using unique 256-bit AES-GCM Data Encryption Keys wrapped by the master key (`KEY_ENCRYPTION_KEY`). Key material is never sent to the web tier or written to logs.
- **Atomic Spending Caps**: Spending is incremented via optimistic atomic concurrency in MongoDB, eliminating double-spending risk.
- **On-Chain Verification**: Purchases are marked `confirmed` only after confirming receipt status and recipient address directly on Ethereum Sepolia.

