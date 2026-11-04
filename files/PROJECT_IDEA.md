# Half-Life: Project Idea

Working title. Telegraph Hackathon Season II, Track 03 (Apps & Agents). Draft v0.1, November 4, 2026.

---

## One line

Every answer an agent buys starts going stale the moment it arrives. Half-Life measures how fast, and makes agents re-buy only when the cost of a stale answer is greater than the price of a fresh one.

## The problem

- **Heartbeat tax.** A personal agent that checks the same things every few minutes (an FX rate, a weather forecast, a payee's sanctions status) buys the same answer hundreds of times a day when each answer is priced per request. Nobody sees this cost because today these checks hit free or flat-rate APIs.
- **Stale reuse.** The opposite failure: reusing an answer too long and acting on an old price or an old status.
- **No guidance.** Nothing tells an agent builder how long a bought answer stays useful, per intent. Builders guess.

## Why we think it is unfelt, and how we will prove it

We have no evidence that nobody has noticed this, and we will not claim it. We will produce the evidence:

1. The **Freshness Atlas** samples live Telegraph intents on a schedule and publishes how fast answers drift and how much independent miners disagree.
2. The **replay benchmark** shows spend and stale-decision rate for a naive agent versus a Half-Life agent on the same schedule.

If the numbers show no meaningful waste, we say so publicly and report that.

## The solution (three parts)

**1. Freshness Atlas (measurement).** A scheduled sampler buys answers from the same intents repeatedly and records two things per intent:
- **Drift**: how much an answer differs from a fresh answer as it ages (relative error for numbers, probability of change for categories).
- **Noise floor**: how much two independent miners disagree at the same moment. Re-buying is pointless when expected drift is smaller than that noise.

The dataset and method are public and open.

**2. The Governor (engine).** An open-source SDK and MCP wrapper around Telegraph's tools. For each request it decides buy or reuse, in what order, when to stop, and when to buy a second miner's answer. Core rule: buy only if `stake x expected drift > price` and `expected drift > noise floor`. Every statement it produces carries its receipt and age.

**3. Reference agent (the app).** A personal assistant that runs recurring errands (FX before a payment, weather before a trip, sanctions screening before paying a wallet). A naive agent and a Half-Life agent run side by side on the same schedule with separate budgets. The headline numbers are asks per day and stale-decision rate.

## Who it is for

- People and teams running personal or business agents that buy intelligence through Telegraph and run recurring checks.
- Builders of agent frameworks and plugins who need a wallet-and-market layer with budgets.
- Other hackathon teams, who are all buyers of intelligence and can adopt the SDK.

## Hackathon fit

- **Track:** Apps & Agents.
- **Mission:** 09 Personal Agent (a wallet and a market wired into the heartbeat loop). Our differentiator is measured results and a reusable engine, not the wiring.
- **Intents (verify live before building):** FX_NOW, WEATHER_FORECAST_VERIFY, SANCTIONS_SCREENING_MATCH. All three appear on Telegraph's mandatory Season II intent list per its bounty tracker.
- **Optional second contribution:** evaluation material for FX_NOW (open bounty), seeded from Atlas data. This must be a distinct contribution.

## What is web3 here (and what is not)

| Web3 | Not web3 |
|------|----------|
| Per-answer payment in USDC (x402 or escrow) | Atlas sampling logic and statistics |
| On-chain settlement receipts that a reviewer can click through | The drift and noise-floor model |
| Escrow balance as a hard spending cap | The buy-or-reuse engine |
| Optional: on-chain spend policy, anchored dataset hashes | Dashboard, API, auth |

The chain is the payment and proof rail. The decision logic is ordinary software.

## Network

**Ethereum Sepolia testnet (chain id 11155111)**, per Telegraph's bounty tracker. The same tracker says the docs' examples use the older Base Sepolia network, and warns not to use the register button on integrate.telegraphprotocol.com for Season II because it registers on Base Sepolia. Verify every address and endpoint in the current docs before coding.

## What is new

- Per-intent, measured freshness (not guessed TTLs), published as open data.
- A noise-floor rule: do not pay for a fresh answer that cannot differ from the old one by more than miners disagree among themselves.
- Stake-aware decisions: diligence scales with value at risk.
- Receipts and age attached to every claim the agent makes.

## Success metrics (all measured, none assumed)

- Asks per day: naive vs Half-Life, same schedule.
- Stale-decision rate: decisions made on answers older than the validated window, checked against periodic forced fresh buys.
- Spend per correct decision.
- Cap adherence: zero spends above the configured cap.
- Atlas coverage: samples per intent, days collected, miners observed.
- Independent adoption: other developers who installed the SDK, opened issues or reproduced a run (counted only when real).

## What we will not claim

- That nobody has built this.
- Savings in real money. Testnet results are labeled testnet.
- "Verified truth". A receipt proves who answered, at what rank, at what cost. It does not prove the answer was correct.
- Any customer, user or adoption numbers we cannot show evidence for.

## Judging map

| Criterion | Points | How this idea earns it |
|-----------|--------|------------------------|
| Technical quality and mainnet readiness | 35 (min 24) | Decay model, decision engine, real autonomous payments, failure handling, security |
| Commercial viability | 25 | Quantified heartbeat tax; plugin for agent frameworks; clear buyer |
| Organic growth, education, activation | 20 | Atlas post, tutorial, 3+ public updates on separate dates, independent reproductions |
| Independent adoption and retention | 10 | SDK installs by other teams (genuine only) |
| Telegraph integration and usage quality | 5 | Real receipts, correct network, receipt verification on-chain |
| Reproducibility, demo, proof | 5 | One-command replay, evidence pack, public data |

## Draft answers to the five commercial questions

Replace bracketed text with measured facts before submitting.

1. **Who is it for?** People and teams running agents that buy Telegraph intelligence on a schedule. [unknown]
2. **What does it improve?** It cuts redundant purchases and prevents decisions on expired answers. [measured asks/day and stale-decision rate]
3. **What does it do today?** [what works on Sepolia: intents covered, days of Atlas data, agents running]
4. **Why would someone adopt it?** It is a drop-in layer that enforces budgets and shows receipts and age for every answer. [evidence of independent use, if any]
5. **How can someone try it?** Sign in with Google, create an agent, fund its testnet wallet, run the sample. [link]

## Gate 0 checks (before committing further)

- [ ] FX_NOW, WEATHER_FORECAST_VERIFY, SANCTIONS_SCREENING_MATCH have live miners on Sepolia.
- [ ] Answers include a timestamp and a stable, parseable format.
- [ ] Miner prices and rank are visible; note whether prices differ.
- [ ] Payment path confirmed (x402 vs escrow) and the USDC contract Telegraph expects on Sepolia.
- [ ] Reusing a purchased answer is permitted by Telegraph's terms.
- [ ] 20+ paid requests made with receipts that verify on Sepolia.
- [ ] Scan the Discord, GitHub bounties and Season I archive for similar builds.
