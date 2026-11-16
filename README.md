# Half-Life Governor

> Every answer an agent buys starts going stale the moment it arrives. Half-Life measures how fast, and makes agents re-buy only when the cost of a stale answer is greater than the price of a fresh one.

**Telegraph Hackathon Season II &bull; Track 01: Apps & Agents (Mission 09: Personal Agent)**  
**Network:** Ethereum Sepolia (`11155111`) &bull; Testnet Funds Only &bull; License: Apache-2.0  
**Live Production URL:** [https://halflifes.vercel.app](https://halflifes.vercel.app)  
**Public Freshness Atlas:** [https://halflifes.vercel.app/atlas](https://halflifes.vercel.app/atlas)  
**Public Dataset & Merkle Root:** [https://halflifes.vercel.app/api/public/dataset](https://halflifes.vercel.app/api/public/dataset)  
**System Status:** [https://halflifes.vercel.app/api/public/status](https://halflifes.vercel.app/api/public/status)  
**Verified On-Chain Purchase:** [Sepolia Etherscan 0xbf2834...](https://sepolia.etherscan.io/tx/0xbf283485aacb2e2964bf53fbd7eba05e080e710a77a756711a3f596a78989c1b)

---

## 1. Five-Line Quickstart

```bash
git clone https://github.com/Umgauthamram/halflife.git && cd halflife
cp .env.example .env && pnpm install
pnpm test                                 # Run all 53+ unit & safety tests
pnpm --filter @half-life/bench replay     # Run side-by-side benchmark
pnpm tsx scripts/first-purchase.ts        # Execute live verified Sepolia ask
```

---

## 2. The Problem: The Heartbeat Tax

Autonomous agents running recurring errands (e.g. checking FX rates before sending payouts, screening payees against sanctions lists, or checking weather forecasts) query intelligence on continuous heartbeat loops.

When intelligence is priced per request:
1. **Heartbeat Tax**: Naive agents buy the exact same answer hundreds of times a day, incurring massive redundant costs.
2. **Stale Reuse**: Guessing arbitrarily long static TTLs causes agents to execute financial transactions on expired prices or outdated sanctions statuses.
3. **No Empirical Guidance**: Builders guess TTL windows blindly because no empirical measurement of intent decay exists.

---

## 3. The Solution

Half-Life provides an end-to-end measurement and decision infrastructure:

```
[ Telegraph Miners (Sepolia) ]
           │
           ▼
[ Freshness Atlas (Sampler) ] ──▶ Empirical Drift Curves & Noise Floor
           │
           ▼
[ The Governor (Decision Engine) ]
   Rule: Buy only if (Stake × Drift > Price) AND (Drift > Noise Floor)
           │
           ├─▶ Action: "reuse"  ──▶ Return verified cached answer + receipt + age ($0 cost)
           └─▶ Action: "buy"    ──▶ Reserve budget ──▶ Settle via Telegraph ──▶ Verify on Sepolia
```

1. **Freshness Atlas**: A background sampler continuously queries live Telegraph intents, calculating:
   - **Empirical Drift**: How fast answers degrade over time ($|answer(t) - answer(0)|$).
   - **Miner Noise Floor**: How much two independent miners disagree at the exact same moment. Re-buying is economically futile when expected drift is smaller than the miner noise floor.
2. **The Governor**: A pure decision engine (`@half-life/governor`) and SDK wrapper. Given the economic stake at risk and intent decay curve, it mathematically decides whether to buy or reuse.
3. **Multi-Layer Spending Controls**:
   - Per-ask spending cap ($0.05 default).
   - Atomic daily spending cap enforced in MongoDB via optimistic concurrency (`$lte: dailyCap - price`).
   - Hardware kill switch: instantly pauses an agent or the sampler before any transaction signature.
4. **On-Chain Settlement Verification**: Viem-powered chain guard verifies all settlement transactions on Sepolia testnet before purchases are confirmed.

---

## 4. Costs, Limits & Economics

| Metric | Value | Details |
| :--- | :--- | :--- |
| **Fresh Purchase Cost** | $0.010 USDC | Settled via Telegraph x402 v2 on Ethereum Sepolia |
| **Cached Reuse Cost** | $0.000 USDC | Served from validated cache; saves $0.010 with zero info loss |
| **Default Per-Ask Cap** | $0.050 USDC | Hard limit enforced by ChainGuard before signature |
| **Default Daily Cap** | $10.00 USDC | Atomic reservation in MongoDB |
| **Supported Intents** | `FX_NOW_EUR`, `WEATHER_CHECK_TEMPERATURE`, `SANCTIONS_SCREENING_MATCH_GENERAL` | Extensible to all 136+ Telegraph intents |

---

## 5. Known Limitations & Observed Miner Issues

Documented fully in [`docs/bounties.md`](docs/bounties.md) with receipts ready for the Telegraph bounties repo:
1. **Miner Parameter Discrepancies**: Miner `31005 (fx-boc)` rejects requests missing `currency: "EUR"`. Half-Life client routes to named miner `31002 (Open ER-API)` by default.
2. **Sepolia Testnet RPC Latency**: Public Sepolia RPCs occasionally rate-limit blocks; Half-Life uses Alchemy with automatic exponential backoff.
3. **Testnet USDC Scope**: All transactions use Telegraph testnet USDC (`0xcc194e1a843B658526D0D5C431f670028582Ae17`). No real customer capital is at risk.

---

## 6. Monorepo Architecture

```
half-life/
  ├── apps/
  │   ├── web/          # Next.js App Router (Public Atlas, Dashboard, Auth.js, /api/v1/ask)
  │   └── worker/       # Node.js service (Atlas Sampler, Decay Estimator, Budget Reservation)
  ├── packages/
  │   ├── shared/       # Zod schemas, types, and strict boot-time env validation
  │   ├── governor/     # Pure mathematical decision engine (no I/O, 100% test coverage)
  │   ├── chain/        # Viem chain guard (Sepolia 11155111, destination allowlists, no unlimited approvals)
  │   ├── telegraph/    # Telegraph client wrapper (x402 v2 payment-signature, named miner routing)
  │   ├── bench/        # Side-by-side replay benchmark simulator & evidence pack exporter
  │   └── sdk/          # Public TypeScript SDK & Model Context Protocol (MCP) server
  └── docs/             # Evaluation guide (JUDGE.md), findings, tutorial, and bounty reports
```

---

## 7. Model Context Protocol (MCP) Integration

Half-Life includes a ready-to-use Model Context Protocol (MCP) wrapper in `@half-life/sdk/mcp` for agent assistants (Cursor, Claude Desktop, Gemini):

```json
{
  "mcpServers": {
    "halflife": {
      "command": "node",
      "args": ["./packages/sdk/dist/mcp-server.js"],
      "env": {
        "HALFLIFE_API_KEY": "hl_live_YOUR_API_KEY",
        "HALFLIFE_BASE_URL": "https://halflifes.vercel.app"
      }
    }
  }
}
```

Available Tools:
- `halflife_ask`: Queries an intelligence intent with economic governance.
- `halflife_explain_decision`: Returns mathematical rationale and noise-floor comparisons.

---

## 8. Reviewer Guide

Judges and evaluators can verify the entire project end-to-end following the 5-step checklist in [`docs/JUDGE.md`](docs/JUDGE.md):
1. **Run It**: Execute a fresh query via cURL or `scripts/first-purchase.ts`.
2. **Check It**: Verify the useful answer and economic reuse decision.
3. **Inspect It**: Inspect the verified on-chain transaction on Etherscan and cryptographic Merkle root.
4. **Break It**: Trigger cap rejection, kill-switch pause, or miner error.
5. **Reproduce It**: Run `pnpm test` and build clean across all 8 packages.

---

## 9. License

Licensed under the Apache License, Version 2.0. See [LICENSE](LICENSE) for details.
