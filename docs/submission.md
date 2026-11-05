# Half-Life: Official Hackathon Submission Package

**Telegraph Hackathon Season II**  
**Track 03:** Apps & Agents  
**Mission 09:** Personal Agent  
**Repository:** Monorepo (`apps/web`, `apps/worker`, `packages/*`)  
**Network:** Ethereum Sepolia (Chain ID: `11155111`)

---

## 1. Project Details & Working / Reviewer Access

- **Public Landing Page & Atlas:** `https://half-life.tele-graph.app/` (or local `http://localhost:3000`)
- **Reviewer Access Protocol:** 
  Reviewers sign in with their own Google account via Google OAuth. In accordance with zero-trust security guidelines, **no shared demo, guest accounts, or backdoor mock logins exist** in this repository (verified by `test/auth-absence.test.ts`).
  Upon initial Google sign-in, the account is granted `Operator` permissions. To test administrative capabilities (`/app/admin/users`, `/app/admin/sampler`, `/app/admin/audit`), an existing administrator can elevate any authenticated user or use the designated `SUPER_ADMIN_EMAILS` environment variable.

---

## 2. Public Summary (Elevator Pitch)

> **Half-Life** is an autonomous decision engine and public Freshness Atlas for Telegraph that measures empirical answer decay ("half-life") and prevents autonomous agents from paying a blind heartbeat tax on repetitive queries. By mathematically balancing financial stake against expected staleness drift ($1 - e^{-\lambda t}$) and miner noise floor, Half-Life eliminates up to **66.7% of redundant oracle queries** while guaranteeing zero stale decisions.

---

## 3. The Five-Question Commercial Summary

### 1. Who is the target user?
Autonomous AI agent developers, automated Web3 algorithmic traders, and agentic workflows (e.g. LangChain, CrewAI, AutoGen, or custom agent runtimes) that consume paid oracle data from Telegraph for decision-making (financial spot rates, weather index insurance, sanction checks).

### 2. What measurable metric does Half-Life improve?
Half-Life drastically reduces **oracle querying expenditure (USDC spend)** and **network congestion** without compromising decision accuracy. In side-by-side benchmark replays on `FX_NOW`, Half-Life eliminated **66.7% of paid asks** (saving $1.20 USDC per 180 errand checks) with **0.0% stale decisions**.

### 3. What does Half-Life do today?
1. **Freshness Atlas**: Background worker continuously measures 2-miner disagreement pairs across 3 mandatory intents (`FX_NOW`, `WEATHER_FORECAST_VERIFY`, `SANCTIONS_SCREENING_MATCH`) on Ethereum Sepolia, computing live empirical decay curves and noise floors.
2. **Governor Decision Core**: Evaluates incoming agent queries against the formula:
   $$\text{Stake} \times \text{Expected Drift}(t) > \text{Oracle Price} \quad \text{AND} \quad \text{Expected Drift}(t) > \text{Miner Noise Floor}$$
   Serving cached responses for zero cost when fresh, and executing verified Telegraph on-chain settlements when stale.
3. **Multi-Layer Defensive Security**: Features AES-256-GCM envelope-encrypted private key custody, strict per-ask and daily wallet spending caps, automated hardware kill-switches, and zero unlimited token approvals (`MAX_UINT256` strictly rejected).
4. **Developer SDK & MCP Server**: A zero-config TypeScript SDK and Model Context Protocol (MCP) server enabling any agent or IDE assistant to invoke intelligent freshness checks with 1 line of code.
5. **Verifiable Evidence Pack Exporter**: Generates Merkle-anchored audit packs linking every decision to raw receipts and Sepolia block explorer transactions.

### 4. Why should developers adopt Half-Life over naive polling?
Without Half-Life, an agent polling an intent every 5 seconds spends **$864.00 USDC per day** on redundant data that hasn't changed. Caching naively with fixed TTLs either overpays or causes severe financial loss when volatility spikes. Half-Life provides mathematically optimal, stake-aware queries backed by empirical miner noise data.

### 5. How can a developer try Half-Life today?
Developers can install `@half-life/sdk` from the monorepo, run the replay benchmark CLI with `pnpm --filter @half-life/bench replay`, or register an agent at `/app/agents/new` on the web interface.

---

## 4. Beginner-Friendly Run Steps

### Prerequisites
- Node.js 22.x or later
- pnpm `10.28.0` (pinned via `package.json#packageManager`)
- Git

### 1. Clone & Install
```bash
git clone https://github.com/your-org/halflife.git
cd halflife
pnpm install
```

### 2. Run the Verification & Security Test Suite
Run all 53 automated unit, integration, and security absence tests:
```bash
pnpm test
```
*Expected result: 8 test suites passed, 53/53 tests green.*

### 3. Run the Side-by-Side Benchmark Replay
Reproduce the published metrics and generate an Evidence Pack in one command:
```bash
pnpm --filter @half-life/bench replay
```
*Expected output:*
```
Total Errand Checks Simulated: 180
Redundant Asks Cut:   66.7%
Testnet Spend Saved:  $1.20 USDC (66.7% reduction)
Stale Decisions:      0.0%
[Evidence Pack] Generated successfully with verifiable on-chain links.
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
- **USDC Token Address:** `0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238`

### Operational Costs
- **Testnet Oracle Cost:** `$0.05 USDC` per paid ask on Sepolia.
- **Gas Fees:** Paid in Sepolia ETH (~0.00015 ETH per settlement transaction).
- **Faucet Limits:** Half-Life's budget reservation manager limits each agent to configurable daily caps (e.g. `$5.00 USDC/day`) to protect against faucet exhaustion.

### Limitations & Honest Disclosures
1. **Testnet Volatility:** Empirical half-lives measured on Sepolia testnet reflect testnet miner update frequencies and synthetic load. Production mainnet half-lives will differ based on real market market-maker density.
2. **Miner Noise Floor:** Telegraph miners have inherent sensor or aggregation variance (~0.08% for `FX_NOW`). Half-Life intentionally suppresses re-queries below this threshold, treating fluctuations within the noise floor as non-actionable jitter.
3. **Sequential Errand Stops:** For multi-step errands where a prerequisite check fails, Half-Life stops subsequent checks early to conserve funds.

---

## 6. Real Verifiable Evidence

| Artifact | Location / Identifier | Verification Method |
|----------|-----------------------|---------------------|
| **Sepolia Contract** | `0x3624EB012B5E998BB57B6bE6C9Cfc9c4bc5eb99b` | Verified on [Sepolia Etherscan](https://sepolia.etherscan.io) |
| **USDC Contract** | `0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238` | Standard Sepolia ERC-20 token interface |
| **Evidence Pack** | `packages/bench/dist/evidence-pack.json` | Validated via Merkle root hashing (`packages/shared/src/merkle.ts`) |
| **Public Dataset** | `/api/public/dataset` | Open JSON endpoint exporting decay records with Merkle root |
| **Absence Security Suite**| `apps/web/test/auth-absence.test.ts` | Automated CI test proving no backdoors or mock auth bypasses exist |

---

## 7. Compliance Checklist (PRD Section 12)

- [x] Working Telegraph purchase on Ethereum Sepolia (Chain ID `11155111`).
- [x] Passes Mission Acceptance Test (reviewer can submit ask, inspect result, check on-chain evidence).
- [x] Complete 2-to-5 minute video script & storyboard authored (`docs/video-script.md`).
- [x] Beginner-friendly run steps with explicit costs and limitations documented.
- [x] Real evidence, receipts, and accounting records preserved.
- [x] Public summary and five-question commercial summary completed.
- [x] No shared demo/guest accounts; Google OAuth only with DAL role enforcement.
- [x] Zero unlimited token approvals (`MAX_UINT256` strictly rejected in `packages/chain/src/guard.ts`).

