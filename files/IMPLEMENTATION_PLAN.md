# Half-Life: Implementation Plan

Draft v0.1, November 4, 2026. Companion to PRD.md and TRD.md. Dates are UTC and come from the hackathon's published schedule, which must be re-checked on the official Rules page.

---

## 1. How to read this plan

- **Fixed dates:** first integration milestone **Nov 14**, community showcase **Nov 20**, submission deadline **Dec 1 at 23:59 UTC**.
- **The one thing that cannot be rushed is data collection.** The Atlas needs weeks of samples, so the sampler must start as early as possible (target: running by Nov 7). Everything else can be built while it runs.
- Every phase has an exit test. A phase is not done until its exit test passes.
- Security gates are part of the phases, not a final pass.
- You said not to plan around build time, so the plan is ordered by dependency and risk. The dates above are the real constraints, and the cut line in section 9 says what to drop first if they bind.

## 2. Phase 0: Gate 0, reality check (Nov 4 to Nov 7)

Purpose: confirm that everything the design assumes is true before writing product code.

**Accounts and setup**
- [ ] Register for the hackathon on the official site (one registration covers all tracks). Join the Discord.
- [ ] Create a Google Cloud OAuth Web client (redirect URI for local and production).
- [ ] Create a MongoDB Atlas project, a cluster, and three database users (web, worker, admin ops). Restrict network access.
- [ ] Create a Vercel project, a worker host, and a domain.
- [ ] Create a Sepolia RPC key. Create a throwaway wallet and fund it with Sepolia ETH and testnet USDC (confirm which USDC contract Telegraph expects).

**Telegraph checks** (record every result in `docs/gate0.md`)
- [ ] Read the docs' Start Here and payment pages. Note every place that mentions Base Sepolia and adapt it to Ethereum Sepolia (chain id 11155111).
- [ ] Use the free find-intents and find-miners tools: do FX_NOW, WEATHER_FORECAST_VERIFY and SANCTIONS_SCREENING_MATCH have live miners? How many, what ranks, what prices?
- [ ] Make 20 or more paid requests. Check the answer format, whether timestamps and confidence exist, and whether the settlement transaction verifies on Sepolia Etherscan.
- [ ] Decide the payment path (x402 or escrow) and whether an escrow balance cap can be set.
- [ ] Check whether reusing a purchased answer is allowed.
- [ ] Check whether the node endpoint supports TLS.
- [ ] Search Discord, the bounty tracker and the Season I archive for similar builds.

**Fallbacks**
- If an intent has no live miners, switch to the next mandatory intent.
- If answers carry no timestamp, use our own request time and document the limitation.
- If payment cannot run from a server-side worker, use the MCP server path.

**Exit test:** a script buys one answer per target intent, the purchase verifies on Sepolia, and the results are written to `docs/gate0.md`. If this fails, stop and revise the idea before continuing.

## 3. Phase 1: Foundation (Nov 5 to Nov 10)

**Repository and tooling**
- [ ] Monorepo with the layout from the TRD. Open-source license file at the top. README skeleton.
- [ ] Pin `packageManager` in `package.json`. Commit exactly one lockfile (`pnpm-lock.yaml`). Delete any other lockfile.
- [ ] CI: install with `npx --yes pnpm@<pinned> install --frozen-lockfile`, typecheck, lint, unit tests, secret scan.
- [ ] `packages/shared`: Zod env validation that refuses to boot in production on missing or short secrets. No fallback values anywhere.

**Design system**
- [ ] Tokens (cream `#F6F0E2`, surface `#FBF7EE`, black `#111111`, lines, functional colors). Poppins files self-hosted through `next/font/local`.
- [ ] Base components: Button, Input, Table, Badge, Notice, Empty and Error states. Focus rings. Reduced motion.

**Authentication and authorization**
- [ ] Auth.js v5, Google only, MongoDB adapter, database sessions, `__Host-` cookies in production.
- [ ] `signIn` callback: Google only and verified email only.
- [ ] `createUser` event: role from the admin allowlist at creation only. Sign-in path never writes role or status.
- [ ] DAL with `requireUser`, `requireAdmin`, owner-scoped query helpers. Last-admin and self-demotion guards.
- [ ] Audit log writes for sign-in, role changes, key and policy changes.
- [ ] Rate limiting helper (`rate_limits` with TTL) on auth routes.
- [ ] Security headers and CSP with nonces.

**Pages**
- [ ] Login page with exactly one action: "Continue with Google".
- [ ] Landing page built from real data only. Before the Atlas has data, show "collecting since" and real counts, or omit the section.
- [ ] Terms and Privacy drafts based on what is really stored (marked as drafts).

**Security gate (must pass before Phase 2 merges):**
- [ ] Authorization matrix test (all routes × Visitor, Member, Admin, second Member).
- [ ] Role-stability test: signing in again never changes role or status.
- [ ] Absence test: no demo, guest, credentials or dev-login route exists.
- [ ] Boot test: production mode without secrets fails.

**Exit test:** a new Google account signs in, lands on an empty dashboard as Member, and cannot reach admin pages or another user's data. A bootstrap admin sees the admin pages. Sign-out and "sign out everywhere" work.

## 4. Phase 2: Telegraph client, chain guard, sampler, Atlas v0 (Nov 7 to Nov 14)

Start the sampler as soon as the safe purchase path exists. Do not wait for the dashboard.

- [ ] `packages/chain`: chain guard (chain id, destination allowlist, token, exact-amount approvals), receipt verification via viem.
- [ ] `packages/telegraph`: client interface, per-intent answer schemas, failure handling, idempotent `requestId`.
- [ ] Wallet generation in the worker with envelope encryption. No API route reads key material.
- [ ] Atomic budget reservation and kill switch checked immediately before signing.
- [ ] System agent for the sampler with its own wallet, daily cap and admin pause.
- [ ] Sampler: schedule, MongoDB lock, two-miner pairs for the noise floor, gap recording, daily cap behavior.
- [ ] Purchase ledger with on-chain verification. Only `confirmed` purchases count.
- [ ] Public Atlas pages (`/atlas`, `/atlas/[intent]`) reading real data. Admin sampler page (last sample per intent, gaps, balance).
- [ ] Alerts for missed intervals and low balance.

**Security gate:** chain guard tests (wrong chain, wrong contract, wrong amount, unlimited approval all rejected). Concurrent reservation test never exceeds a cap. No public route can trigger a purchase.

**Exit test:** the sampler has run unattended for 24 hours with every purchase verified on Sepolia, and the public Atlas shows real samples with correct counts and gaps.

### Milestone: Nov 14 first integration

Show: a real autonomous purchase with a verified Sepolia transaction, the receipts, and the first partial Atlas curves. Post **public update 1** (what was built, what was measured, what is blocked).

## 5. Phase 3: Governor, agents, API keys, SDK (Nov 12 to Nov 20)

- [ ] `packages/governor`: decision function, cold-start conservative windows, `calibrated` flag, monotonicity property test.
- [ ] Atlas statistics job: drift curves (isotonic), noise floors, calibration status.
- [ ] Agent management UI: create, policy (per-ask and daily caps, allowed intents), pause, wallet address with funding instructions and a testnet notice.
- [ ] API keys: create, show once, scopes, revoke, hashed storage, constant-time compare, rate limits, cookie ignored on `/api/v1`.
- [ ] `/api/v1/ask` implementing decide, reserve, buy, verify, store, with every decision recorded.
- [ ] Ledger and decisions explorer with Sepolia links.
- [ ] SDK and MCP wrapper (internal first, published after the benchmark exists).
- [ ] Confidence-triggered second opinion if confidence fields exist (F-34).

**Security gate:** API-key tests (hash-only storage, immediate revocation, scope enforcement, wrong-agent access returns 404). NoSQL injection tests on every route that accepts strings. Rate limit tests on `ask`.

**Exit test:** a Member signs in with Google, creates an agent, funds it, makes a call with the SDK, sees the decision reason, the verified purchase and the receipt. Pausing the agent stops the next purchase.

### Milestone: Nov 20 showcase

Present Atlas v0, the Governor decision explanations, and a live verified purchase. Post **public update 2** with the Atlas v0 write-up (method, data, limitations).

## 6. Phase 4: Reference agent, side-by-side run, benchmark (Nov 18 to Nov 27)

- [ ] Reference agent with recurring errands (FX, weather, payee screening) on a heartbeat schedule.
- [ ] Naive mode and Half-Life mode with separate wallets and budgets, same schedule.
- [ ] Forced fresh-buy checkpoints as the stale-decision proxy.
- [ ] Run the side-by-side for at least 24 hours, preferably several days.
- [ ] `packages/bench`: one command replays stored data and prints asks, spend, stale-decision rate, cap adherence.
- [ ] Evidence pack exporter (receipts, transaction links, ledger, decisions, method, limitations).
- [ ] Evidence-bound briefs: each claim with receipt id and age, expired items flagged (F-35).
- [ ] Results page in the app, reading the stored results.

**Exit test:** the benchmark command reproduces the published numbers from the stored data on a clean machine, and the failure cases (miner timeout, cap reached, invalid answer) are visible in the ledger.

## 7. Phase 5: Hardening, docs, submission (Nov 25 to Dec 1)

**Hardening**
- [ ] Full security test suite green in CI. Header check. Boot check. Dependency review (including recently published versions).
- [ ] Review the audit log for completeness. Test a database restore once.
- [ ] Accessibility pass (contrast, focus, labels, keyboard, phone widths).
- [ ] Accuracy pass over every page and README: testnet labeled, estimates labeled, no unverifiable claims.

**Docs and education**
- [ ] Tutorial: "How to stop paying twice for the same answer on Telegraph" with working steps and costs.
- [ ] README: setup, environment variables, run commands, network details, how Telegraph is used, limitations.
- [ ] Publish the SDK and the open dataset after the license and README are in place.
- [ ] Reach out to other builders and collect genuine independent usage (installs, issues, reproductions). Record only real evidence. Do not invent or self-generate adoption.

**Submission package** (check each against the official Rules page)
- [ ] Project details with a working or reviewer-access link (reviewers sign in with their own Google account; no shared credentials exist).
- [ ] 2 to 5 minute demo video: problem, Atlas data, a live verified purchase, the Governor's reasoning, the side-by-side result, a failure case.
- [ ] Beginner-friendly run steps with costs and limitations.
- [ ] Real evidence: receipts, transaction links, accounting records, the evidence pack.
- [ ] Public summary.
- [ ] The five-question commercial summary (who, what it improves, what it does today, why adopt, how to try), filled with measured facts.
- [ ] Public update 3 and the tutorial posted on separate dates.
- [ ] Read the prize payment terms, including country and identity checks.

**Exit test:** a person who has never seen the project follows the README, signs in with their own Google account, creates an agent and reproduces a verified purchase and the benchmark. Submit with at least a full day to spare.

## 8. Phase 6 (optional, only if everything above is done)

- On-chain spend policy: smart account or session key limited to Telegraph's contract with a daily cap (F-60).
- Anchored dataset hashes: a daily Merkle root published in a transaction (F-61).
- Evaluation material for FX_NOW derived from Atlas data, submitted as a separate contribution (F-62).
- Sequential checks with early stopping (F-36).

## 9. Cut line

**Never cut:** Google-only auth with roles, authorization tests, chain guard, spending caps, on-chain verification of purchases, the sampler and public Atlas, the Governor, the side-by-side benchmark, honest reporting, README, video, submission.

**Cut in this order when time is short:**
1. Phase 6 items.
2. Confidence-triggered second opinion (F-34).
3. Evidence-bound briefs beyond a simple receipt-and-age column (F-35).
4. Published SDK package (keep the code in the repository).
5. Usage and budget views beyond the ledger (F-54).
6. Account deletion UI (keep the manual process documented, F-14).
7. Landing sections beyond hero, problem, how it works and Atlas.

## 10. Risks and fallbacks

| Risk | Fallback |
|------|----------|
| Intent has no live miners | Next mandatory intent |
| Answers have no timestamp | Use request time, document the limitation |
| Faucets limit testnet funds | Lower sampling frequency, fewer intents, adaptive sampling |
| Free MongoDB tier lacks time-series | Regular collection with compound index on `{intent, ts}` |
| Escrow cap cannot be set | Keep application-level caps and keep wallet balances small |
| Payment cannot run server-side | MCP server path |
| Measured drift is small | Report honestly: the value is bounded staleness and scale, not large savings |
| Node endpoint lacks TLS | Send only non-sensitive data, treat responses as untrusted |
| Google consent screen limits sign-in | Publish the consent screen to production, test with an account not on any test list |
| Vercel install failure | Use `npx --yes pnpm@<pinned>`, single lockfile, Node 22.x, printed version line |
| Team has fewer people than the plan assumes | Apply the cut line at the start of Phase 3 |

## 11. Working agreements

- Small pull requests into `main`, CI green before merge.
- Every P0 feature ships with tests, audit events and an authorization test.
- Decisions that were debated get a short ADR (network, payment path, schema choices).
- Nothing is described as verified unless it was run. Mark unverified items in the README.
- Keep a running `docs/gate0.md` and `docs/findings.md` so the write-ups use real numbers.

## 12. Definition of done (whole project)

- All P0 features ship and pass their tests.
- At least 21 days of Atlas data, or as many days as the schedule allowed, with gaps shown.
- Benchmark reproducible from one command.
- Every purchase in the evidence pack verifies on Sepolia.
- The security test suite is green and the absence test confirms no demo or guest routes.
- Submission completed with margin, and all claims in the submission are backed by evidence.
