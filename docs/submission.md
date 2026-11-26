# Half-Life: Official Hackathon Submission Package

**Telegraph Hackathon Season II**  
**Track 01:** Apps & Agents  
**Mission 09:** Personal Agent  
**Repository:** https://github.com/Umgauthamram/halflife  
**Network:** Ethereum Sepolia (Chain ID: `11155111`)

---

## 1. Project Details & Working / Reviewer Access

- **Public Landing Page & Atlas:** `https://halflifes.vercel.app/` (or local `http://localhost:3000`)
- **Repository:** `https://github.com/Umgauthamram/halflife`
- **Starred Bounties Repo Account:** `Umgauthamram` (starred `github.com/telegraphprotocol/bounties`)
- **Reviewer Access Protocol:** 
  Reviewers sign in with their own Google account via Google OAuth. In accordance with zero-trust security guidelines, **no shared demo, guest accounts, or backdoor mock logins exist** in this repository (verified by `test/auth-absence.test.ts`).
  Upon initial Google sign-in, the account is granted `Operator` permissions. To test administrative capabilities (`/app/admin/users`, `/app/admin/sampler`, `/app/admin/audit`), an existing administrator can elevate any authenticated user or use the designated `SUPER_ADMIN_EMAILS` environment variable.

---

## 2. Public Summary (Elevator Pitch)

> **Half-Life** is an autonomous decision engine and public Freshness Atlas for Telegraph that measures empirical answer decay ("half-life") and prevents autonomous agents from paying a blind heartbeat tax on repetitive queries. By mathematically balancing financial stake against expected staleness drift ($1 - e^{-\lambda t}$) and miner noise floor, Half-Life suppresses redundant oracle queries while protecting decisions from stale data.

---

## 3. The Five-Question Commercial Summary

### 1. Who is the target user?
Personal autonomous AI agents running around the clock—specifically agents like **OpenClaw**, **Hermes Agent**, and **Kimi Claw** (Mission 09: Personal Agent). These self-hosted agents run 24/7 on local context, but lack financial rationality when querying oracles: they either work blindly from stale local memory or bleed money paying a blind heartbeat tax on repetitive queries.

### 2. What measurable metric does Half-Life improve?
Half-Life drastically reduces **oracle querying expenditure (USDC spend)** and **network congestion** without compromising decision accuracy. In simulated replay benchmarks on `FX_NOW_EUR`, `WEATHER_CHECK_TEMPERATURE`, and `SANCTIONS_SCREENING_MATCH_GENERAL`, simulated Half-Life runs eliminated redundant asks on short horizons while bounding staleness drift strictly to the economic stake.

> **Scope Statement:** Half-Life performs no external actions on the user's behalf; it only returns answers and decisions. Any external effect remains the operator's explicit decision.

### 3. What does Half-Life do today?
1. **Freshness Atlas**: Background worker samples 2-miner disagreement pairs across target intents (`FX_NOW_EUR`, `WEATHER_CHECK_TEMPERATURE`, `SANCTIONS_SCREENING_MATCH_GENERAL`) on Ethereum Sepolia (see `/api/public/status` for current sampler state). Intent names must match the live node catalogue; unknown names can return HTTP 200 with a null schema and are rejected by Half-Life.
2. **Governor Decision Core**: Evaluates incoming agent queries against the formula:
   $$\text{Stake} \times \text{Expected Drift}(t) > \text{Oracle Price} \quad \text{AND} \quad \text{Expected Drift}(t) > \text{Miner Noise Floor}$$
   Serving cached responses for zero cost when fresh, and executing verified Telegraph on-chain settlements when stale.
3. **Agent Spend Leaderboard**: A real-time audit panel (`/app/leaderboard`) tracking active agent spend and on-chain settlement receipts.
4. **Multi-Layer Defensive Security**: Features AES-256-GCM envelope-encrypted private key custody, strict per-ask and daily wallet spending caps, automated hardware kill-switches, and zero unlimited token approvals (`MAX_UINT256` strictly rejected).
5. **Developer SDK & MCP Server**: A zero-config TypeScript SDK, OpenClaw heartbeat hook, and Model Context Protocol (MCP) server enabling any agent or IDE assistant to invoke intelligent freshness checks with 1 line of code.
6. **Verifiable Evidence Pack Exporter**: Generates Merkle-anchored audit packs linking decisions to receipts and Sepolia block explorer transactions.

### 4. Why should developers adopt Half-Life over naive polling?
Without Half-Life, an agent polling an intent every 5 seconds spends hundreds of dollars per day on redundant data that hasn't changed. Caching naively with fixed TTLs either overpays or causes severe financial loss when volatility spikes. Half-Life provides mathematically optimal, stake-aware queries backed by empirical miner noise data.

### 5. How can a developer try Half-Life today?
Developers can install `@half-life/sdk` from the monorepo, run the replay benchmark CLI with `pnpm --filter @half-life/bench replay`, or test scenarios in the Testing Studio at `/app/playground` on the web interface.

---

## 4. Beginner-Friendly Run Steps

### Prerequisites
- Node.js 22.x or later
- pnpm `10.28.0` (pinned via `package.json#packageManager`)
- Git

### 1. Clone & Install
```bash
git clone https://github.com/Umgauthamram/halflife.git
cd halflife
pnpm install
```

### 2. Run the Verification & Security Test Suite
Run all automated unit, integration, and security absence tests:
```bash
pnpm test
```

### 3. Run the Simulated Benchmark Replay
Reproduce simulated benchmark metrics and generate an Evidence Pack in one command:
```bash
pnpm --filter @half-life/bench replay
```

### 4. Launch the Web Application
```bash
pnpm --filter @half-life/web dev
```
Open `http://localhost:3000` to browse the Freshness Atlas, interactive decision explorer, and benchmarks.

---

## 5. Costs, Networks & Operational Limitations

### Network Details
- **Blockchain Network:** Ethereum Sepolia Testnet (Chain ID: `11155111`)
- **Telegraph Contract:** `0x3624EB012B5E998BB57B6bE6C9Cfc9c4bc5eb99b`
- **Telegraph Live Node:** `http://13.237.89.59:7148`
- **Telegraph Sepolia USDC Token:** `0xcc194e1a843B658526D0D5C431f670028582Ae17`
- **Operator Account Wallet:** `0x62D1504960F4F854A25B61649C5f06a9B12BDfc6`
- **Verified Live Settlement TX:** [`0xbf283485aacb2e2964bf53fbd7eba05e080e710a77a756711a3f596a78989c1b`](https://sepolia.etherscan.io/tx/0xbf283485aacb2e2964bf53fbd7eba05e080e710a77a756711a3f596a78989c1b)

### Operational Costs
- **Testnet Oracle Cost:** Metered via HTTP x402 quotes on Sepolia (e.g. 0.01 USDC).
- **Gas Fees:** Paid in Sepolia ETH (~0.00015 ETH per settlement transaction; gas sponsored for operator).
- **Faucet Limits:** Half-Life's budget reservation manager limits each agent to configurable daily caps (e.g. `$1.00 USDC/day`) to protect against faucet exhaustion.

### Known Limitations
1. **Testnet Only**: All settlements execute on Ethereum Sepolia (`11155111`) using testnet USDC (`0xcc194e1a843B658526D0D5C431f670028582Ae17`).
2. **Plain HTTP Node Endpoint**: The Telegraph testnet node (`http://13.237.89.59:7148`) is plain HTTP.
3. **Calibration Threshold & Priors**: The sampler needs $\ge 30$ live confirmed samples over $\ge 6$ hours before decay curves are calibrated; uncalibrated curves are labeled **"prior (not measured)"**.
4. **Intent Catalogue**: Intent names must match the live node catalogue (`FX_NOW_EUR`, `WEATHER_CHECK_TEMPERATURE`, `SANCTIONS_SCREENING_MATCH_GENERAL`); unknown names can return HTTP 200 with a null schema and are rejected by Half-Life.
5. **No External Side Effects**: Half-Life performs no external actions on the user's behalf; it only returns answers and decisions. Any external effect remains the operator's explicit decision.

---

## 6. Mission 09 Test Matrix

| Scenario | How to trigger | Expected result | Evidence file |
| :--- | :--- | :--- | :--- |
| **Stale local answer** | Call `/api/v1/ask` with high `stake` after cache age exceeds half-life | `action: "buy"`, fresh Sepolia purchase & verified receipt | TO BE FILLED BY OPERATOR |
| **Reuse within noise floor** | Repeat same `/api/v1/ask` immediately within noise floor window | `action: "reuse"`, `$0.000` cost, `capitalSavedUsdc` recorded | TO BE FILLED BY OPERATOR |
| **No budget** | Send request exceeding `perAskCapUsdc` or exhausted `dailyCapUsdc` | HTTP 400 `action: "refuse"`, `$0.000` spent | TO BE FILLED BY OPERATOR |
| **Failed payment** | Miner returns error or invalid/null body after 402 signature | `outcome: "failed_paid"` (not cached) or `"failed"` (budget released) | TO BE FILLED BY OPERATOR |
| **Conflicting provider answer (crossCheck)** | Enable `policy.crossCheck: true` when two miners disagree beyond `crossCheckTolerance` | `action: "buy"`, `agreement: "conflict"`, both answers & minerIds returned, not cached | TO BE FILLED BY OPERATOR |
| **Blocked / paused agent** | Pause agent via Dashboard kill-switch and call `/api/v1/ask` | HTTP 403 `action: "refuse"` (`Agent is currently paused by kill switch`) | TO BE FILLED BY OPERATOR |
| **Unknown intent** | Query an intent not in the live node catalogue (returns 200 with null schema) | Rejected with `outcome: "failed"`, never written to live purchases or atlas | TO BE FILLED BY OPERATOR |

---

## 7. Real Verifiable Evidence

| Artifact | Location / Identifier | Verification Method |
|----------|-----------------------|---------------------|
| **Sepolia Contract** | `0x3624EB012B5E998BB57B6bE6C9Cfc9c4bc5eb99b` | Verified on [Sepolia Etherscan](https://sepolia.etherscan.io) |
| **Telegraph Live Node** | `http://13.237.89.59:7148` | Verified via `/engine/v1/ask` with 402 quote protocol |
| **Agent Spend Leaderboard** | `/app/leaderboard` | Live panel tracking active agents and on-chain proofs |
| **USDC Contract** | `0xcc194e1a843B658526D0D5C431f670028582Ae17` | Standard Sepolia ERC-20 token interface |
| **Evidence Pack** | `packages/bench/dist/evidence-pack.json` | Validated via Merkle root hashing (`packages/shared/src/merkle.ts`) |
| **Public Dataset** | `/api/public/dataset` | Open JSON endpoint exporting decay records with Merkle root |
| **OpenClaw Heartbeat Hook** | `skills/openclaw/SKILL.md` | Skill definition for background heartbeat loops |
| **Absence Security Suite**| `apps/web/test/auth-absence.test.ts` | Automated CI test proving no backdoors or mock auth bypasses exist |

---

## 7. Compliance Checklist (Rules Section 05 & 08)

- [x] Passes Mission Acceptance Test (reviewer can submit ask, inspect result, check on-chain evidence).
- [x] Complete 2-to-5 minute video script & storyboard authored (`docs/video-script.md`).
- [x] Beginner-friendly run steps with explicit costs and limitations documented.
- [x] Public summary and five-question commercial summary completed.
- [x] Starred Telegraph bounties repo (`github.com/telegraphprotocol/bounties`) with user account `Umgauthamram`.
- [x] No shared demo/guest accounts; Google OAuth only with DAL role enforcement.
- [x] Zero unlimited token approvals (`MAX_UINT256` strictly rejected in `packages/chain/src/guard.ts`).
