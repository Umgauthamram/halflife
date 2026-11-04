# Half-Life: Product Requirements Document

Draft v0.1, November 4, 2026. Telegraph Hackathon Season II, Track 03 (Apps & Agents). Companion to PROJECT_IDEA.md, TRD.md and IMPLEMENTATION_PLAN.md.

---

## 1. Summary

Half-Life is a web application and open-source SDK that helps agents decide when a purchased answer has expired. It has three parts:

1. **Freshness Atlas**: a scheduled sampler that measures, per Telegraph intent, how fast answers drift and how much independent miners disagree. Results are public.
2. **Governor**: a decision engine (SDK, MCP wrapper, API) that decides buy or reuse for each request and enforces spending caps.
3. **Reference agent and dashboard**: a signed-in web app where a user creates an agent, funds its testnet wallet, sets a spending policy, runs it, and inspects every purchase, decision and receipt.

Network: Ethereum Sepolia testnet (chain id 11155111), per Telegraph's bounty tracker. All funds are testnet funds.

## 2. Goals and non-goals

**Goals**
- G1. Produce a public, reproducible measurement of answer freshness per intent.
- G2. Cut redundant purchases and stale-answer decisions, and prove it with a side-by-side replay.
- G3. Make every purchase verifiable: receipt, settlement transaction, age at time of use.
- G4. Enforce spending limits in more than one place so an agent cannot overspend.
- G5. Ship a secure, accessible web app with Google-only sign-in and role-based access.
- G6. Be honest: label testnet, estimates and unverified items everywhere.

**Non-goals (v1)**
- Real-money or mainnet operation.
- Non-custodial wallet management (documented as the mainnet path).
- Email/password, magic link, wallet login, social providers other than Google.
- Demo, guest or shared accounts of any kind.
- Writing our own miners (optional evaluator contribution only).
- Multi-organization tenancy (each user owns their own resources).

## 3. Users and roles

**Human roles**
- **Visitor** (not signed in): can read the landing page, the public Atlas pages, docs, terms and privacy.
- **Member** (any verified Google account that signs in): owns agents, API keys, purchases and decisions.
- **Admin**: operates the platform. Manages users, views sampler health and the audit log, pauses agents or the sampler.

**Machine principal**
- **Agent API key**: authenticates SDK and MCP calls. It can only reach `/api/v1/*` and only for the agent that owns it.

**Personas**
- *Agent builder* (Member): runs a personal or business agent that buys intelligence on a schedule, wants a budget and an audit trail.
- *Reviewer or judge* (Visitor or Member): wants to inspect public data, then sign in with their own Google account to run a scenario. No shared credentials exist.
- *Operator* (Admin): keeps the sampler healthy and the platform safe.

## 4. Problem and hypotheses

Hypotheses to be tested with measurement, not assumed:

- **H1.** Recurring agents buy the same answer many times within its useful life.
- **H2.** For many intents, expected drift over short windows is smaller than the noise between independent miners, so a fresh purchase adds no real information.
- **H3.** A decision rule based on stake, drift and noise reduces asks without increasing stale decisions.

If H1 to H3 are not supported by data, the product reports that finding.

## 4b. Feature list

Priority: **P0** must ship, **P1** should ship, **P2** later. IDs are used in the plan and tests.

### Public

- **F-01 (P0) Landing page.** Cream background, black text, Poppins. Sections defined in section 7.
- **F-02 (P0) Public Atlas.** Read-only pages showing per-intent drift curves, noise floors, sample counts and collection dates. Data comes from the real database. If there is not enough data yet, the page says "collecting since <date>" and shows real counts.
- **F-03 (P1) Public API for Atlas data** (rate limited, cached) and a downloadable dataset.
- **F-04 (P0) Docs.** Quickstart for the SDK and MCP wrapper, explanation of the decision rule, network details.
- **F-05 (P0) Terms and Privacy** (drafts based on real data practices, marked for review).

### Authentication and access

- **F-10 (P0) Sign in with Google.** One button on one page. Sign-in and sign-up are the same action. Google is the only identity provider.
- **F-11 (P0) No demo, guest, test or shared accounts.** No such code paths or routes exist.
- **F-12 (P0) Roles.** Visitor, Member, Admin as defined above. Enforced on the server.
- **F-13 (P0) Sessions.** Database-backed, revocable, with sign-out and "sign out everywhere".
- **F-14 (P1) Account deletion.** A member can delete their account and owned data.

### Agents and spending

- **F-20 (P0) Create agent.** Name, allowed intents, spending policy (per-ask cap, daily cap), mode (naive or Half-Life).
- **F-21 (P0) Agent wallet.** A platform-generated Sepolia wallet per agent. Only the address is ever shown. User funds it with testnet ETH and testnet USDC.
- **F-22 (P0) Spending limits.** Per-ask and daily caps enforced atomically before any payment. Optional escrow-balance cap as a second layer.
- **F-23 (P0) Kill switch.** A member can pause their agent. An admin can pause any agent or the sampler. Takes effect before the next payment.
- **F-24 (P0) API keys.** Create, show once, scope, revoke. Stored hashed.

### Governor

- **F-30 (P0) Buy-or-reuse decision** per request using stake, price, age, drift and noise floor. Every decision stores its inputs and reason.
- **F-31 (P0) Purchase ledger.** Every purchase: intent, miner, rank, price, settlement transaction, signal hash, answer, timestamps, verification status.
- **F-32 (P0) On-chain verification.** A purchase is "confirmed" only after the settlement transaction is read from Sepolia and matches chain id, contract, token and amount.
- **F-33 (P1) Cold-start behavior.** Until enough Atlas samples exist for an intent, use conservative fixed windows and mark decisions "uncalibrated".
- **F-34 (P1) Confidence-triggered second opinion.** Buy a second independent miner's answer when stake and confidence justify it.
- **F-35 (P1) Evidence-bound briefs.** Any summary the agent produces lists each claim with receipt id and age, and flags expired items.
- **F-36 (P2) Sequential checks with early stopping** for multi-intent decisions.

### Reference agent and benchmark

- **F-40 (P0) Reference agent** running recurring errands on a schedule.
- **F-41 (P0) Side-by-side run.** Naive and Half-Life agents with separate wallets and budgets on the same schedule.
- **F-42 (P0) Replay benchmark.** One command reproduces the comparison from stored data. Outputs asks, spend, stale-decision rate, cap adherence.
- **F-43 (P0) Evidence pack.** Exportable bundle: receipts, transaction links, ledger, decisions, method, limitations.

### Dashboard

- **F-50 (P0) My agents.** List, create, pause, configure.
- **F-51 (P0) Ledger and decisions explorer** with filters and links to Sepolia Etherscan.
- **F-52 (P0) Benchmark results page.**
- **F-53 (P0) Admin: users, roles, sampler health, audit log, pause controls.** Admin only.
- **F-54 (P1) Usage and budget view** per agent.

### Optional

- **F-60 (P2) On-chain spend policy** (smart account or session key limited to Telegraph's contract with a daily cap).
- **F-61 (P2) Anchored dataset hashes** (daily Merkle root published in a transaction).
- **F-62 (P2) FX_NOW evaluation material** contributed to Telegraph's bounty, derived from Atlas data. Separate contribution.

## 5. Key user flows

**Sign in.** Visitor clicks "Continue with Google", completes Google's consent screen, returns to the dashboard. First sign-in creates the account as Member. If the verified email is on the admin allowlist at account creation, the role is Admin. Later sign-ins never change the role.

**Create and run an agent.** Member creates an agent, copies its wallet address, funds it from a Sepolia faucet, sets caps, picks a mode, starts it. The ledger fills with purchases and decisions.

**Use the SDK.** Member creates an API key for an agent, installs the SDK, calls `ask()`. The Governor decides buy or reuse, enforces caps, returns the answer with receipt and age.

**Review.** A reviewer opens the public Atlas, signs in with their own Google account, creates an agent, runs the sample scenario, and inspects the evidence pack.

## 6. Pages and information architecture

**Public**
- `/` landing
- `/login` Google sign-in (the only sign-in page)
- `/atlas` and `/atlas/[intent]` public measurements
- `/docs` quickstart and method
- `/terms`, `/privacy`

**Signed in (Member)**
- `/app` overview
- `/app/agents`, `/app/agents/[id]` (policy, wallet address, keys, pause)
- `/app/ledger` purchases, `/app/decisions`
- `/app/benchmarks`
- `/app/settings` (profile, sessions, delete account)

**Admin only**
- `/app/admin/users`
- `/app/admin/sampler`
- `/app/admin/audit`

Navigation items are filtered by role, and every page and API enforces the role again on the server.

## 7. Design system and page specs

### 7.1 Tokens

- **Background (cream):** `#F6F0E2`
- **Surface (lighter cream, cards and inputs):** `#FBF7EE`
- **Text (black):** `#111111`
- **Secondary text:** `#3D3A33`
- **Lines and dividers:** `#CFC5AE`; strong borders `#111111`
- **Functional only:** error `#9B1C1C`, success `#1F5E3B`. No decorative accent color.
- **Font:** Poppins for all interface text, weights 400, 500, 600, self-hosted through `next/font/local` (the font is open-licensed). The only exception is a system monospace stack for hashes, addresses and code, for legibility. Say if you want to remove this exception.
- **Shape:** 4px radius at most, 1px borders, no gradients, no glass, no drop shadows beyond a 1px hairline. Light theme only (`color-scheme: light`).
- **Contrast:** black on cream is far above WCAG AA. Check every secondary-text and state color against the background before shipping.
- **Numbers:** Poppins figures may not be tabular, so right-align numeric columns and give them fixed widths.

### 7.2 Landing page

Content rules: no invented statistics, testimonials, customer logos or "trusted by" claims. Anything numeric comes from the live database or is omitted. No three-card feature row, no decorative icons.

Sections, in order:
1. **Hero.** Headline (draft): "Know when a bought answer has expired." One supporting line. One button: "Continue with Google". Beside it, a real, live table of the latest public Atlas samples.
2. **The problem.** The heartbeat tax in plain words, with a worked example using real sampled data once it exists.
3. **How it works.** Four steps: measure, decide, buy, prove. Written text and one real diagram, not an icon grid.
4. **Atlas.** Live numbers: intents covered, samples collected, days of data, miners observed. Links to `/atlas`.
5. **Spending limits.** Plain explanation of the layered caps and the testnet-only notice.
6. **For developers.** The real SDK snippet, shown only once the SDK exists.
7. **Open source.** License and repository link, shown only once public.
8. **Footer.** Terms, Privacy, network notice ("Ethereum Sepolia testnet. No real funds.").

Behavior: working keyboard navigation, visible black 2px focus rings, reduced-motion respected, no animation that blocks scrolling. Responsive from phone to wide desktop.

### 7.3 Login page

- Centered single column on cream.
- Title "Sign in", one sentence: "Use your Google account. New here? The same button creates your account."
- One button: "Continue with Google".
- A short notice: "Testnet only. No real funds."
- Links to Terms and Privacy.
- Error states with clear text (for example, "Google did not verify this email address").
- No email field, no password, no "continue as guest", no demo link.

## 8. Authentication and authorization requirements

**Authentication**
- AUTH-1. Google OpenID Connect is the only sign-in method.
- AUTH-2. Sign-in is rejected unless Google reports the email as verified.
- AUTH-3. Accounts are keyed by Google's stable subject id, not by email.
- AUTH-4. Sessions are stored server-side so they can be revoked, and expire after inactivity and after an absolute lifetime.
- AUTH-5. Session cookies are httpOnly, secure, SameSite=Lax and host-scoped.
- AUTH-6. Role assignment happens only at account creation (admin allowlist) or by an admin action. Signing in again never changes a role or reactivates a deactivated user.
- AUTH-7. No demo, guest, test, magic-link or dev-login route exists in any environment that can reach production data.
- AUTH-8. Machine access uses API keys on a separate namespace and never relies on cookies.

**Authorization**
- AUTHZ-1. Every route, page, server action and API handler checks identity and role on the server. Middleware only redirects.
- AUTHZ-2. Every query for member-owned data includes the owner id from the session. IDs from the client are never trusted alone.
- AUTHZ-3. Admin actions require a fresh role check against the database.
- AUTHZ-4. The last admin cannot be removed, and nobody can change their own role.
- AUTHZ-5. Agent API keys are scoped to one agent and to named permissions (`read`, `ask`).

**Permission matrix**

| Action | Visitor | Member | Admin | API key |
|--------|---------|--------|-------|---------|
| View landing, docs, public Atlas | yes | yes | yes | n/a |
| Create, view, pause own agents | no | yes | yes | no |
| View own ledger and decisions | no | yes | yes | read scope, own agent |
| Create and revoke own API keys | no | yes | yes | no |
| `ask()` via SDK | no | no | no | ask scope, own agent |
| View other users' data | no | no | metadata only | no |
| Pause any agent or the sampler | no | no | yes | no |
| Manage users and roles | no | no | yes | no |
| View audit log | no | no | yes | no |

## 9. Security and privacy requirements

All items are requirements, and each has a test in the TRD.

**Secrets and configuration**
- SEC-1. No default or fallback secrets in code. The app refuses to start in production if a required secret is missing or too short.
- SEC-2. Secrets live in the host's secret store, never in the repository. CI scans for committed secrets.
- SEC-3. Different secrets and database users for the web app and the worker, each with least privilege.

**Web application**
- SEC-10. Strict Content Security Policy with nonces, `frame-ancestors 'none'`, HSTS, `nosniff`, a strict referrer policy and a minimal permissions policy.
- SEC-11. All input validated with schemas. Request body size limits on every route.
- SEC-12. Database queries are built from validated values only. Operator injection (for example `{"$ne": ""}`) is rejected at validation.
- SEC-13. No raw HTML rendering of any external data (miner answers, intent names, profile fields).
- SEC-14. Mutating requests check the Origin header. No state-changing GET routes.
- SEC-15. Rate limits on every unauthenticated route and per user, per key and per IP on authenticated ones. Any endpoint that causes a purchase also has a spend limit.
- SEC-16. Errors return a generic message and an id. Details go to logs, never to clients.

**Keys and money**
- SEC-20. No private key is ever returned by an API, logged, or stored unencrypted. Agent wallet keys are encrypted at rest with envelope encryption, and decrypted only in the worker at signing time.
- SEC-21. Spending is reserved atomically before payment: per-ask cap, daily cap, and optional escrow balance cap.
- SEC-22. Before signing any transaction the worker verifies chain id, destination contract and token against an allowlist. No unlimited token approvals.
- SEC-23. A purchase is marked confirmed only after the settlement is verified on-chain.
- SEC-24. Miner answers are untrusted input: schema-validated, size-limited, never executed, and never inserted into prompts as instructions.
- SEC-25. API keys are random 256-bit values, stored as hashes, shown once, compared in constant time, revocable, and rate limited.

**Data and operations**
- SEC-30. Audit log (append-only) for sign-ins, key and policy changes, role changes, pauses, purchases and admin actions.
- SEC-31. TLS everywhere. Database access restricted by network allowlist and credentials. Backups enabled.
- SEC-32. Dependencies pinned and installed from a frozen lockfile with a pinned package manager version. Recently published package versions are reviewed before use.
- SEC-33. Testnet-only notice shown in the app and in the docs.
- SEC-34. Personal data limited to what Google provides (email, name, picture). Deletion supported.

## 10. Non-functional requirements

Targets are goals to be measured, not results.

- **Decision latency:** buy-or-reuse decision under 50 ms at p95, excluding the purchase itself.
- **Availability of the sampler:** gaps are detected and shown on the admin page and on public Atlas pages.
- **Accessibility:** WCAG 2.1 AA basics for contrast, focus, labels and keyboard use.
- **Responsive:** landing, login and ledger views work on a phone.
- **Observability:** structured logs with request ids, health endpoint, error tracking, worker heartbeat.
- **Reproducibility:** one command reproduces the benchmark from stored data.

## 11. Metrics and benchmark plan

- **Atlas:** samples per intent, days of data, miners observed, drift curves, noise floors, gaps.
- **Benchmark:** asks per day, spend, stale-decision rate, cap adherence, spend per correct decision. Naive versus Half-Life, same schedule, separate wallets.
- **Ground truth for staleness:** periodic forced fresh buys, used as a proxy. An external public data source may validate the experiment but is not used by the product.
- **Reporting rules:** report failures and limitations, not only wins. Label testnet and proxy measurements. Do not compare against other products without running them.

## 12. Hackathon compliance mapping

- Final submission needs a working Telegraph purchase and passes the mission acceptance test: a reviewer can run it with a new input, check the result, inspect the real Telegraph request and its on-chain evidence, test a failure case, and reproduce from the instructions.
- Score 70 or more out of 100, with at least 24 of 35 technical points, to be eligible for a main prize.
- At least three public updates on separate dates, a tutorial others can follow, and evidence of independent developers trying the work.
- Required submission items: project details with a working or reviewer-access link, a 2 to 5 minute demo video, run steps with costs and limitations, real evidence (receipts, accounting), a public summary, and a five-question commercial summary.
- Key dates (UTC): first integration milestone Nov 14, community showcase Nov 20, submission deadline Dec 1 at 23:59.
- Registration does not confirm prize eligibility. Read the prize payment terms, including country and identity checks.
- Confirm each rule on the official Rules page before relying on this summary.

## 13. Risks, assumptions, open questions

**Risks**
- Intents may lack live miners, or answers may lack timestamps. Mitigation: Gate 0 checks and fallback intents.
- Measured drift may be small, making savings look negligible. Mitigation: report honestly; the value is bounded staleness and scale.
- Testnet funds (ETH for gas, USDC) may be limited by faucets. Mitigation: adaptive sampling, lower frequency.
- Custodial testnet wallets are a risk if the platform is compromised. Mitigation: testnet-only, caps, encryption, documented mainnet path (non-custodial).
- Telegraph's node endpoint may not use TLS. Mitigation: send only non-sensitive data to it, and treat all responses as untrusted.

**Assumptions**
- Reusing a purchased answer within the buyer's own system is allowed.
- Telegraph's escrow or x402 flow can run from a server-side worker.

**Open questions**
- Exact payment path and USDC contract expected on Sepolia.
- Whether answers carry confidence and timestamps.
- Whether MongoDB Atlas free tier supports time-series collections (fallback: a normal collection with a compound index).
- Final product name and domain.
