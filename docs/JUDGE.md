# Half-Life Governor: Judge & Reviewer Evaluation Guide

**Hackathon Track**: Track 01 — Apps & Agents  
**Commercial Mission**: Mission 09: Personal Agent  
**Target Network**: Ethereum Sepolia (`Chain ID: 11155111`)  
**Live Production URL**: [https://halflifes.vercel.app](https://halflifes.vercel.app)  
**Public Atlas**: [https://halflifes.vercel.app/atlas](https://halflifes.vercel.app/atlas)  
**Public Dataset & Merkle Root**: [https://halflifes.vercel.app/api/public/dataset](https://halflifes.vercel.app/api/public/dataset)  
**Telegraph Node URL**: `http://13.237.89.59:7148`  
**Telegraph Contract**: `0x3624EB012B5E998BB57B6bE6C9Cfc9c4bc5eb99b`  
**Telegraph Sepolia USDC**: `0xcc194e1a843B658526D0D5C431f670028582Ae17`  

---

## Acceptance Criteria Checklist (Season II Rules)

| Requirement | Description | How to Verify |
| :--- | :--- | :--- |
| **01. Run it** | Run the app or agent with a new, realistic input | Run the quickstart script or cURL against `/api/v1/ask` |
| **02. Check it** | Check the useful result | Governor returns answer, action (`buy` or `reuse`), and exact cost |
| **03. Inspect it** | Inspect real Telegraph request & transaction evidence | Check the on-chain Sepolia tx on Etherscan and cryptographic receipt hash |
| **04. Break it** | Test a reasonable failure case | Attempt a call exceeding budget cap or with an active kill-switch |
| **05. Reproduce it** | Follow instructions to reproduce end-to-end | Step-by-step instructions below with zero manual setup |

---

## 01. Run It (New Realistic Input)

You can test Half-Life in two ways:
1. **Directly via cURL against the deployed production API**
2. **Locally via Node / TypeScript script**

### Option A: Direct API Call via cURL
Run this in any terminal:

```bash
curl -X POST https://halflifes.vercel.app/api/v1/ask \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer hl_live_5e24cb11155111evaluator" \
  -d '{
    "intent": "FX_NOW_EUR",
    "params": { "currency": "EUR" },
    "stake": 100,
    "requestId": "judge_eval_'$(date +%s)'"
  }'
```

### Option B: Local CLI Execution
Clone and run the standalone verification script:

```bash
git clone https://github.com/Umgauthamram/halflife.git
cd halflife
pnpm install
pnpm tsx scripts/first-purchase.ts
```

---

## 02. Check It (Useful Result)

When you make the call:
1. **Fresh Buy (`action: "buy"`)**:
   The response returns the verified answer from an independent Telegraph miner (e.g., current EUR/USD exchange rate), along with:
   ```json
   {
     "action": "buy",
     "reason": "No cached answer available",
     "answer": { "rates": { "USD": 1.0852 } },
     "priceUsdc": 0.010,
     "txHash": "0xbf283485aacb2e2964bf53fbd7eba05e080e710a77a756711a3f596a78989c1b",
     "receiptHash": "0xcbd760e2e2e331f1e2cf9f3a4abc2a50ae78733ab5b8c7a1e113c75a5bd7952f",
     "signalHash": "0xa2e5e4b475263e7efa12ec7507895a34255a551d36d9a1d4131eee07ea1326de",
     "minerId": "31002"
   }
   ```
2. **Economic Reuse (`action: "reuse"`)**:
   If the same request is repeated within the empirical half-life window where expected drift $\le$ miner noise floor:
   ```json
   {
     "action": "reuse",
     "reason": "Expected drift (0.0005) <= noise floor (0.0018); fresh buy yields zero new information",
     "answer": { "rates": { "USD": 1.0852 } },
     "priceUsdc": 0.000,
     "capitalSaved": 0.010
   }
   ```
   **The user paid $0.000, saving $0.010 without information loss.**

---

## 03. Inspect It (Real Telegraph Evidence)

Every purchase is verified on-chain and settled through Telegraph's x402 v2 protocol on Ethereum Sepolia.

1. **Verify On-Chain Settlement**:
   Inspect the verified live transaction on Sepolia Etherscan:
   [https://sepolia.etherscan.io/tx/0xbf283485aacb2e2964bf53fbd7eba05e080e710a77a756711a3f596a78989c1b](https://sepolia.etherscan.io/tx/0xbf283485aacb2e2964bf53fbd7eba05e080e710a77a756711a3f596a78989c1b)
   - **Contract**: `0x3624EB012B5E998BB57B6bE6C9Cfc9c4bc5eb99b` (Telegraph)
   - **Payment Asset**: `0xcc194e1a843B658526D0D5C431f670028582Ae17` (USDC)
   - **Amount**: `0.010 USDC`
2. **Inspect the Ledger**:
   Navigate to `/app/ledger` to view every transaction, block confirmation, miner rank, and receipt hash.
3. **Verify Dataset Merkle Root**:
   Query `GET https://halflifes.vercel.app/api/public/dataset` to inspect the Merkle tree anchoring all raw samples.

---

## 04. Break It (Failure Modes & Safety)

Test reasonable failure cases to verify Half-Life's resilience and budget protection.

### Test A: Budget Exceeded (Per-Ask Cap)
Attempt to spend more than the agent's configured maximum ask cap ($0.05 USDC):

```bash
curl -X POST https://halflifes.vercel.app/api/v1/ask \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer hl_live_5e24cb11155111evaluator" \
  -d '{
    "intent": "FX_NOW_EUR",
    "params": { "currency": "EUR" },
    "stake": 100,
    "maxPriceUsdc": 0.001,
    "requestId": "break_cap_'$(date +%s)'"
  }'
```
**Expected Outcome**: Request is safely blocked (`400 Bad Request` or `action: "refuse"`), and $0.00 USDC is transferred.

### Test B: Blocked / Compromised API Key
1. Go to Dashboard -> API Key Access -> Click **Block Key** (confirm with "delete").
2. Try repeating the cURL query.
**Expected Outcome**: Immediate `403 Forbidden` (`Agent is currently paused by kill switch`).

### Test C: Miner Error / `failed_paid` Handling
When an external miner fails to return an answer:
- Half-Life tags the outcome as `failed_paid`.
- The reserved budget is atomically refunded.
- `failed_paid` is **never** cached as a valid answer.

---

## 05. Reproduce It

To run the complete test suite locally:

```bash
# 1. Install dependencies
pnpm install

# 2. Run unit & integration test suite across all 8 packages
pnpm test

# 3. Verify side-by-side benchmark reproducibility
pnpm --filter @half-life/bench test
```

All 53+ test suites verify deterministic math, EIP-712 payment signatures, and isotonic decay curves.
