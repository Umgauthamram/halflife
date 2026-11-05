# Half-Life: Hackathon Demo Video Script & Storyboard

**Duration:** 4 minutes 15 seconds  
**Track:** Track 03: Apps & Agents — Mission 09: Personal Agent  
**Target Audience:** Hackathon Reviewers, Autonomous Agent Engineers, Web3 Data Economists  
**Theme:** Light Cream (`#F6F0E2`), Monospace tabular data, verifiable on-chain evidence.

---

## Storyboard Overview

| Timestamp | Segment | Visual Scene | Narration & Key Message |
|-----------|---------|--------------|-------------------------|
| **0:00 – 0:40** | **Act I: The Problem** | Terminal logs showing rapid `$0.05 USDC` charges + Landing Page hero | "Autonomous agents are bleeding money paying a blind heartbeat tax on Telegraph." |
| **0:40 – 1:25** | **Act II: Freshness Atlas** | `/atlas` empirical curves for `FX_NOW`, `WEATHER`, `SANCTIONS` | "We don't guess decay. We measured empirical half-lives across three mandatory intents." |
| **1:25 – 2:20** | **Act III: Live Purchase & Governor** | `/app/agents/new` -> Live Sepolia Settlement on Etherscan | "The Governor only pays when Stake × Expected Drift > Price AND Drift > Miner Noise." |
| **2:20 – 3:15** | **Act IV: Replay Benchmark** | CLI running `pnpm --filter @half-life/bench replay` + `/app/benchmarks` | "66.7% redundant asks eliminated with 0.0% stale decisions." |
| **3:15 – 3:45** | **Act V: Defensive Security** | `/app/admin/audit` + Budget Cap & Hardware Kill Switch demo | "No demo backdoors, envelope-encrypted wallet custody, atomic daily budget ceiling." |
| **3:45 – 4:15** | **Act VI: SDK & Developer Access** | Public SDK snippet, MCP server in IDE, Merkle dataset export | "A single drop-in SDK call turns any autonomous agent into a fiscally rational buyer." |

---

## Detailed Minute-by-Minute Script

### Act I: The Problem — The Blind Heartbeat Tax (0:00 – 0:40)
**[Visual Cue: 0:00]**  
Open on a dark terminal showing an autonomous trading agent polling Telegraph every 5 seconds. Every line logs:  
`[INFO] Telegraph ask submitted: intent=FX_NOW cost=$0.05 USDC (Balance: $12.40 -> $12.35 -> $12.30...)`  
Split-screen: The terminal side-by-side with an empty wallet balance warning.

**[Voiceover (Confident, crisp, professional)]**  
"In the decentralized agent economy, autonomous agents run on paid oracle data. But today, agents suffer from a fatal flaw: **The Blind Heartbeat Tax**.  
Every minute, bots blindly re-query Telegraph networks for answers that haven't changed. They pay $0.05 USDC every single cycle—burning hundreds of dollars a month on redundant queries, while still risking acting on stale data when market volatility actually spikes.  
Welcome to **Half-Life**—the autonomous decision engine that measures answer decay on Telegraph and makes agents re-buy only when it is mathematically rational."

---

### Act II: The Freshness Atlas — Empirical Decay Curves (0:40 – 1:25)
**[Visual Cue: 0:40]**  
Cut to the Half-Life Web Application (`apps/web`). Smooth transition to the public **Freshness Atlas** (`/atlas`).  
Mouse scrolls over the three intent cards: `FX_NOW`, `WEATHER_FORECAST_VERIFY`, and `SANCTIONS_SCREENING_MATCH`.  
Hover over the interactive decay curves showing half-life ($t_{1/2}$) and miner noise floor.

**[Voiceover]**  
"Rather than assuming theoretical freshness, Half-Life builds the industry’s first **Freshness Atlas** using unattended background workers.  
We continuously sample 2-miner disagreement pairs across three mandatory intents on Ethereum Sepolia:
1. **FX_NOW**: High volatility with a measured half-life of 94 seconds and a miner noise floor of 0.08%.
2. **WEATHER_FORECAST_VERIFY**: Moderate stability, changing on meteorological update intervals with a half-life of 3.9 hours.
3. **SANCTIONS_SCREENING_MATCH**: Long-tail regulatory lists with a half-life exceeding 72 hours.

These empirical constants feed directly into our mathematical decision core."

---

### Act III: The Governor Decision Engine & Live Sepolia Purchase (1:25 – 2:20)
**[Visual Cue: 1:25]**  
Navigate to `/app/agents/new`. Create a new agent:
- Name: `Portfolio-Risk-Sentinel`
- Intent: `FX_NOW`
- Stake: `$10.00 USDC`
- Daily Spending Cap: `$5.00 USDC`
- Per-Ask Cap: `$0.10 USDC`

Click **Create Agent**. Jump to `/api/v1/ask` execution demo. Show the Governor formula card on screen:
$$\text{Expected Drift}(t) = 1 - e^{-\lambda t}$$
$$\text{Condition: } (\text{Stake} \times \text{Expected Drift} > \text{Price}) \quad \text{AND} \quad (\text{Expected Drift} > \text{Noise Floor})$$

Now trigger an ask. Half-Life evaluates: *Age is 12 seconds, Drift = 0.085%, Value of Freshness = $0.0085 < Price ($0.05). **REJECT / SERVE CACHE**.*  
Fast-forward elapsed time to 120 seconds. Age is now 120s, Expected Drift = 58.8%, Value of Freshness = $5.88 > Price ($0.05). **EXECUTE BUY**.  
Cut to **Sepolia Etherscan** showing the live transaction hash verifying settlement on contract `0x3624EB012B5E998BB57B6bE6C9Cfc9c4bc5eb99b`.

**[Voiceover]**  
"Here is the core Governor formula in action.  
When an agent queries Half-Life, it supplies its financial stake. If the loss from expected drift is smaller than the oracle price, Half-Life serves the cached answer instantly for zero cost.  
Only when Expected Drift exceeds the miner noise floor AND the financial risk exceeds the ask price does the agent dispatch a payment.  
And notice our Chain Guard: purchases execute strictly on Ethereum Sepolia, with atomic allowance checks and zero unlimited token approvals."

---

### Act IV: Side-by-Side Replay Benchmark (2:20 – 3:15)
**[Visual Cue: 2:20]**  
Open terminal in `packages/bench`. Run:  
`pnpm --filter @half-life/bench replay`  
Watch the 180-errand side-by-side simulation execute live in 2 seconds.  
Show the summary table printed to stdout and mirrored in `/app/benchmarks`:
- Naive Agent Paid Asks: 180 | Half-Life Agent Paid Asks: 60
- Naive Spend: $1.80 USDC | Half-Life Spend: $0.60 USDC
- Redundant Asks Eliminated: **66.7%**
- Stale Decisions: **0.0%**

Click the button: **Download Verifiable Evidence Pack**. Open the resulting JSON showing cryptographic receipts and Sepolia tx links.

**[Voiceover]**  
"To prove Half-Life works under rigorous scrutiny, we built a replay benchmark simulator.  
In a side-by-side test of 180 errand checks on the same timeline, a naive polling bot paid $1.80 USDC across 180 calls.  
The Half-Life agent eliminated 66.7% of paid asks, saving 67% of oracle spend, with **zero stale decisions**.  
Every decision is packaged into an exportable Evidence Pack, with raw receipts, Merkle root verification, and live block explorer links."

---

### Act V: Enterprise Security & No-Backdoor Architecture (3:15 – 3:45)
**[Visual Cue: 3:15]**  
Navigate to `/app/admin/audit` and `/app/admin/users`.  
Show the immutable audit log recording key rotation, budget updates, and execution decisions.  
Open the terminal and run `pnpm test` showing the automated security suite:  
`✓ test/auth-absence.test.ts (2 tests) -> Verifies NO guest/demo routes exist`  
`✓ src/crypto.test.ts -> Verifies AES-256-GCM envelope encryption`

**[Voiceover]**  
"Half-Life is built to institutional security standards:
- **No guest or demo backdoors**: Authentication is Google OAuth with database-verified sessions and Data Access Layer role enforcement.
- **Hardware Isolation**: Worker private keys are envelope-encrypted using AES-256-GCM with separate key-encryption keys. The web front-end never touches decrypted private keys.
- **Multi-layer spending controls**: Atomic database reservations enforce both per-ask and daily wallet caps, backed by an instant hardware kill-switch."

---

### Act VI: Developer SDK, MCP & Submission (3:45 – 4:15)
**[Visual Cue: 3:45]**  
Show VS Code opening an agent project. Highlight 3 lines of code:
```typescript
import { HalfLifeClient } from "@half-life/sdk";
const hl = new HalfLifeClient({ apiKey: process.env.HALFLIFE_API_KEY });
const { answer, decision } = await hl.ask({ intent: "FX_NOW", stakeUsdc: 10.0 });
```
Show MCP Server tool `halflife_decide` registered in Claude/Gemini IDE agent sidecar.  
Finally, show `/api/public/dataset` returning Merkle-anchored decay records.

**[Voiceover]**  
"Integrating Half-Life requires just three lines of TypeScript or our turnkey Model Context Protocol server for AI coding assistants.  
The entire codebase—all 8 monorepo packages, 53 automated test suites, and the open Freshness Atlas dataset—is fully open-source and ready for production on Ethereum Sepolia.  
Stop paying the blind heartbeat tax. Build economically rational agents with Half-Life."

**[Visual Cue: 4:10 – 4:15]**  
Title Card:  
**Half-Life: Answer Decay Measurement & Decision Engine for Telegraph**  
GitHub: `https://github.com/your-org/halflife`  
Sepolia Contract: `0x3624EB012B5E998BB57B6bE6C9Cfc9c4bc5eb99b`  
Fade to cream background.

