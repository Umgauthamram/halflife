# Tutorial: How to Stop Paying Twice for the Same Answer on Telegraph

Autonomous agents query external intelligence repeatedly. Without decay management, an agent running a 5-minute loop executes 288 paid requests per day per check.

In this tutorial, you will learn how to integrate the **Half-Life SDK** into an agent to reduce redundant queries by 60%+ while preventing decisions on expired data.

---

## 1. Get an API Key

1. Sign in to your Half-Life dashboard using Google: `https://halflifes.vercel.app/login`.
2. Navigate to **Agents** &rarr; **Create Agent**.
3. Name your agent (e.g. `Treasury Guard`), select **Half-Life Mode**, and configure your spending limits:
   - Per-ask cap: `$0.05`
   - Daily cap: `$1.00`
   - Default stake: `$100.00`
4. Copy your agent API key (`hl_live_...`). This key is shown only once and stored as a salted SHA-256 hash.

---

## 2. Install the SDK

```bash
pnpm add @half-life/sdk
# or
npm install @half-life/sdk
```

---

## 3. Query Intelligence with Economic Governance

Instead of calling Telegraph directly on every heartbeat, wrap your query with `HalfLifeClient`:

```typescript
import { HalfLifeClient } from "@half-life/sdk";

const client = new HalfLifeClient({
  apiKey: process.env.HALFLIFE_API_KEY!,
  baseUrl: "https://halflifes.vercel.app",
});

async function checkExchangeRateBeforePayout() {
  const response = await client.ask({
    intent: "FX_NOW_EUR",
    params: { currency: "EUR" },
    stake: 500, // $500 value at risk for this payment
  });

  if (response.action === "reuse") {
    console.log(`[Half-Life] Reused verified answer (${response.ageSeconds.toFixed(1)}s old)`);
    console.log(`[Half-Life] Reason: ${response.reason}`);
  } else {
    console.log(`[Half-Life] Fresh answer purchased! Settlement TX: ${response.txHash}`);
    console.log(`[Half-Life] Reason: ${response.reason}`);
  }

  return response.answer;
}
```

---

## 4. Understanding the Decision Rationale

When you call `ask()`, the Governor evaluates:

$$\text{Buy if } (\text{Stake} \times \text{Expected Drift} > \text{Price}) \quad \text{AND} \quad (\text{Expected Drift} > \text{Noise Floor})$$

### Case 1: Answer is 45 seconds old
- Expected Drift: `0.0004`
- Miner Noise Floor: `0.0012`
- **Result**: `action: "reuse"`
- **Reason**: *"Expected drift (0.0004) is below miner noise floor (0.0012)"*
- *Insight*: Two independent miners disagree by `0.0012` right now. Paying for a new answer cannot add any information beyond that noise.

### Case 2: Answer is 45 minutes old
- Expected Drift: `0.0150`
- Miner Noise Floor: `0.0012`
- Stake: `$500` &rarr; Expected stale loss = `$500 × 0.0150 = $7.50`
- Answer Price: `$0.01`
- **Result**: `action: "buy"`
- **Reason**: *"Expected stale loss ($7.5000) exceeds price ($0.0100) and drift exceeds noise floor"*

---

## 5. Summary

By replacing blind static TTLs with measured answer decay and miner noise floors, your agents:
1. Cut unnecessary testnet/mainnet asks by **60% to 80%**.
2. Bound staleness strictly to the economic value of each decision.
3. Automatically adhere to hard per-ask and daily spending limits.

