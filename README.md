# Half-Life

> Every answer an agent buys starts going stale the moment it arrives. Half-Life measures how fast, and makes agents re-buy only when the cost of a stale answer is greater than the price of a fresh one.

**Telegraph Hackathon Season II &bull; Track 03: Apps & Agents (Mission 09: Personal Agent)**  
**Network:** Ethereum Sepolia Testnet (Chain ID: `11155111`) &bull; Testnet Funds Only &bull; License: Apache-2.0

---

## 1. The Problem: The Heartbeat Tax

Autonomous agents running recurring errands (e.g. checking FX rates before sending payouts, screening payees against sanctions lists, or verifying meteorological forecasts) query intelligence on continuous heartbeat loops. 

When intelligence is priced per request:
1. **Heartbeat Tax**: Naive agents buy the exact same answer hundreds of times a day, incurring massive redundant costs.
2. **Stale Reuse**: Guessing arbitrarily long static TTLs causes agents to execute financial transactions on expired prices or outdated sanctions statuses.
3. **No Empirical Guidance**: Builders guess TTL windows blindly because no empirical measurement of intent decay exists.

---

## 2. The Solution

Half-Life provides an end-to-end, open-source measurement and decision infrastructure:

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
           ├─▶ Action: "reuse"  ──▶ Return verified cached answer + receipt + age
           └─▶ Action: "buy"    ──▶ Reserve budget ──▶ Settle via Telegraph ──▶ Verify on Sepolia
```

1. **Freshness Atlas**: A background sampler continuously queries live Telegraph intents, calculating:
   - **Empirical Drift**: How fast answers degrade over time ($|answer(t) - answer(0)|$).
   - **Miner Noise Floor**: How much two independent miners disagree at the exact same moment. Re-buying is economically futile when expected drift is smaller than the miner noise floor.
2. **The Governor**: A pure decision engine (`@half-life/governor`) and SDK wrapper. Given the economic stake at risk and intent decay curve, it mathematically decides whether to buy or reuse.
3. **Multi-Layer Spending Controls**:
   - Per-ask spending cap.
   - Atomic daily spending cap enforced in MongoDB via optimistic concurrency (`$lte: dailyCap - price`).
   - Hardware kill switch: instantly pauses an agent or the sampler before any transaction signature.
4. **On-Chain Settlement Verification**: Viem-powered chain guard verifies all settlement transactions on Sepolia testnet before purchases are confirmed.

---

## 3. Monorepo Architecture

```
half-life/
  ├── apps/
  │   ├── web/          # Next.js App Router (Public Atlas, Dashboard, Auth.js, /api/v1/ask)
  │   └── worker/       # Node.js service (Atlas Sampler, Envelope Encryption, Budget Reservation)
  ├── packages/
  │   ├── shared/       # Zod schemas, types, and strict boot-time env validation
  │   ├── governor/     # Pure mathematical decision engine (no I/O, 100% test coverage)
  │   ├── chain/        # Viem chain guard (Sepolia 11155111, destination allowlists, no unlimited approvals)
  │   ├── telegraph/    # Telegraph client wrapper & intent answer validators
  │   ├── bench/        # Side-by-side replay benchmark simulator & evidence pack exporter
  │   └── sdk/          # Public TypeScript SDK & Model Context Protocol (MCP) server
  └── docs/             # ADRs, Gate 0 records, tutorial, and memory constraints
```

---

## 4. Quickstart

### Prerequisites
- Node.js 22.x
- `pnpm` (v10.28.0 recommended)
- MongoDB instance (local or MongoDB Atlas)

### Setup & Installation
```bash
# Clone the repository
git clone https://github.com/your-org/half-life.git
cd half-life

# Copy environment variables
cp .env.example .env

# Install workspace dependencies (frozen lockfile)
npx --yes pnpm@10.28.0 install --frozen-lockfile
```

### Run Tests
```bash
# Run all unit, security, and property test suites across the monorepo
pnpm test
```

### Run Side-by-Side Replay Benchmark (One-Command)
```bash
# Replays 180 recurring checks comparing a Naive Agent vs. Half-Life Governor
pnpm --filter @half-life/bench replay
```

### Start Local Development
```bash
# Start the Next.js web application
pnpm --filter @half-life/web dev

# Open http://localhost:3000
```

---

## 5. Model Context Protocol (MCP) Integration

Half-Life includes a ready-to-use Model Context Protocol (MCP) wrapper in `@half-life/sdk/mcp` for agent assistants (Cursor, Claude Desktop, Gemini):

```json
{
  "mcpServers": {
    "halflife": {
      "command": "node",
      "args": ["./packages/sdk/dist/mcp-server.js"],
      "env": {
        "HALFLIFE_API_KEY": "hl_live_YOUR_API_KEY",
        "HALFLIFE_BASE_URL": "https://your-halflife-domain.app"
      }
    }
  }
}
```

Available Tools:
- `halflife_ask`: Queries an intelligence intent with economic governance.
- `halflife_explain_decision`: Returns mathematical rationale and noise-floor comparisons.

---

## 6. Security Guarantees & Honest Reporting

- **Strict Google-Only Authentication**: No demo, guest, test, or credentials backdoor routes exist (enforced by automated CI tests).
- **Envelope Encryption**: Agent private keys are encrypted at rest with AES-256-GCM using unique per-record Data Encryption Keys wrapped by the platform master key.
- **Zero Unlimited Approvals**: The Viem Chain Guard strictly rejects any ERC-20 approval with `MAX_UINT256` or exceeding the exact transaction amount.
- **Testnet Disclosure**: All funds and receipts are on the Ethereum Sepolia testnet (`11155111`). No real financial value or customer adoption is claimed.

---

## 7. License

Licensed under the Apache License, Version 2.0. See [LICENSE](LICENSE) for details.

