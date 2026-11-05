---
name: openclaw-half-life-governor
description: ClawHub Skill that wires Telegraph inference and Half-Life freshness governor into OpenClaw's 24/7 heartbeat loop.
version: 1.0.0
author: Half-Life Team
repository: https://github.com/your-org/halflife
intents:
  - WEB_SEARCH
  - QUESTION_ANSWERING
  - WEATHER_CHECK
  - CRYPTO_PRICE
---

# OpenClaw Half-Life Governor Skill

Wires the **Half-Life Answer Decay Decision Engine** and **Telegraph Network** into OpenClaw's background heartbeat loop.

## The Problem Solved
Self-hosted OpenClaw instances running around the clock either:
1. Work blindly from **stale local context** without real-time grounding.
2. Or pay a **blind heartbeat tax**, burning $0.05 USDC every single cycle for redundant queries that haven't changed.

## How It Works
On each OpenClaw heartbeat (e.g., every 60 seconds):
1. The skill inspects the active intent (`WEB_SEARCH`, `QUESTION_ANSWERING`, `WEATHER_CHECK`, `CRYPTO_PRICE`).
2. It queries Half-Life Governor:
   $$\text{Stake} \times (1 - e^{-\lambda t}) > \text{Price} \quad \text{AND} \quad \text{Expected Drift} > \text{Miner Noise Floor}$$
3. **If fresh:** Returns cached context instantly ($0.00 cost).
4. **If stale:** Purchases a fresh, cryptographically verified answer from Telegraph on Ethereum Sepolia and signs with the agent's isolated wallet.
5. Emits receipts to the **Live Spend Leaderboard** (`/app/leaderboard`).

## Installation in OpenClaw

```bash
clawhub install half-life-governor
```

Or configure in your OpenClaw agent config (`claw.json`):
```json
{
  "skills": ["half-life-governor"],
  "halfLife": {
    "apiKey": "hl_live_...",
    "endpoint": "http://localhost:3000",
    "stakeUsdc": 10.0,
    "intents": ["WEB_SEARCH", "CRYPTO_PRICE", "WEATHER_CHECK"]
  }
}
```

## TypeScript Heartbeat Hook
```typescript
import { OpenClawHeartbeatHook } from "@half-life/sdk";

const hook = new OpenClawHeartbeatHook({
  apiKey: process.env.HALFLIFE_API_KEY!,
});

// Run in OpenClaw heartbeat loop
const result = await hook.onHeartbeat(
  {
    agentId: "openclaw-worker-01",
    agentName: "Sentinel-Alpha",
    walletAddress: "0xB980b2dBA0004e12f8efF99E5978aB1fa8179517",
    stakeUsdc: 15.0,
  },
  "CRYPTO_PRICE",
  { symbol: "ETH" }
);

console.log(result.action, result.answer, result.txHash);
```

