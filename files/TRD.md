# Half-Life: Technical Requirements Document

Draft v0.1, November 4, 2026. Companion to PRD.md. Items marked **[verify]** were not confirmed against current Telegraph documentation and must be checked in Phase 0.

---

## 1. Decisions

| Area | Decision |
|------|----------|
| Language | TypeScript everywhere, pnpm monorepo |
| Web app | Next.js (App Router) on Vercel |
| Worker | Node service on a small VM or container host (sampler, purchases, benchmark runs) |
| Database | MongoDB Atlas, official `mongodb` driver, Zod for validation |
| Auth | Auth.js v5, Google provider only, database sessions in MongoDB |
| Chain | Ethereum Sepolia (chain id 11155111), `viem` for chain access |
| Payments | Telegraph flow via x402 or escrow in USDC **[verify]** |
| Styling | Tailwind with custom tokens, Poppins via `next/font/local` |
| Tests | Vitest, Playwright smoke tests |
| CI | GitHub Actions |

**Why a separate worker.** Vercel functions are short-lived and time-limited, which suits the web app and API. A sampler that runs every few minutes, signs transactions and waits for confirmations belongs in a long-lived process. Key material is also decrypted only in that process, never in the web tier.

## 2. Architecture

```
Visitor / Member / Admin (browser)
        |  HTTPS, Google OAuth
        v
[Web app + API]  Vercel (Next.js)  ---- reads/writes ---->  [MongoDB Atlas]
        |                                                        ^
        |  job requests (documents)                              |
        v                                                        |
[Worker]  VM/container  ---- buys via Telegraph ---> Telegraph contract + node (Ethereum Sepolia)
   |  sampler, Governor runs, benchmark, on-chain verification   |
   |                                                             |
   +---- decrypts wallet keys only here ---- reads receipts via Sepolia RPC

SDK / MCP clients (agents)  --- API key, HTTPS --->  /api/v1/*  (web app)
```

- The web app never holds decrypted wallet keys and never signs transactions.
- The web app and worker communicate through MongoDB documents (a `jobs` collection with an atomic claim), not through an open inbound port on the worker.

## 3. Network and chain configuration

- **Chain:** Ethereum Sepolia testnet, chain id 11155111, per Telegraph's bounty tracker.
- **Telegraph contract:** `0x3624EB012B5E998BB57B6bE6C9Cfc9c4bc5eb99b` as reported in the same tracker **[verify]**.
- **Node:** the tracker lists an IP and port. It may not use TLS, so send it nothing sensitive and treat its responses as untrusted **[verify]**.
- **Warning from the tracker:** the docs' examples use the older Base Sepolia network, and the register button on integrate.telegraphprotocol.com registers on Base Sepolia. Do not follow Base Sepolia examples without adapting them.
- **Config values** (environment, validated at boot): `CHAIN_ID=11155111`, `TELEGRAPH_CONTRACT`, `TELEGRAPH_NODE_URL`, `SEPOLIA_RPC_URL`, `USDC_ADDRESS` **[verify which token the escrow expects]**.
- **Chain guard:** before every signature the worker checks that the connected chain id equals `CHAIN_ID`, that the destination equals an allowlisted address, and that any token approval is for the exact amount needed.
- **Gas:** the agent wallet needs Sepolia ETH unless the payment flow is gasless **[verify]**.
- **Explorer links:** Sepolia Etherscan transaction URLs in the ledger.

## 4. Repository layout

```
half-life/
  apps/
    web/          Next.js app: public pages, auth, dashboard, admin, /api
    worker/       Node service: sampler, purchases, verification, benchmark
  packages/
    shared/       Zod schemas, types, env validation, constants
    governor/     pure decision engine (no I/O), heavily tested
    telegraph/    Telegraph client (intents, miners, ask, receipts)
    chain/        viem helpers, chain guard, receipt verification
    sdk/          public SDK + MCP wrapper (published later)
    bench/        replay benchmark and evidence-pack exporter
  infra/          compose for local Mongo, deployment notes
  LICENSE         open-source license (proposed Apache-2.0)
  README.md
```

`governor` and `chain` guard logic are pure or narrowly scoped so they can be tested without network access.

## 5. Authentication

**Library and provider.** Auth.js v5 with the Google provider only. Authorization code flow with PKCE, state and nonce are handled by the library. Account linking by email is disabled; accounts are identified by Google's subject id.

**Sketch**

```ts
export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: MongoDBAdapter(clientPromise),
  providers: [Google({ allowDangerousEmailAccountLinking: false })],
  session: { strategy: 'database', maxAge: 60 * 60 * 12, updateAge: 60 * 60 },
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === 'production' ? '__Host-hl.session' : 'hl.session',
      options: { httpOnly: true, sameSite: 'lax', path: '/', secure: process.env.NODE_ENV === 'production' },
    },
  },
  callbacks: {
    async signIn({ account, profile }) {
      // Google only, and only verified emails
      return account?.provider === 'google' && profile?.email_verified === true;
    },
    async session({ session, user }) {
      session.user.id = user.id;
      session.user.role = user.role;      // read from the database on every request
      session.user.status = user.status;
      return session;
    },
  },
  events: {
    async createUser({ user }) { /* set role: ADMIN_EMAILS contains user.email ? 'admin' : 'member'; status 'active'; write audit */ },
    async signIn({ user }) { /* update lastSignInAt; write audit */ },
  },
});
```

**Rules**
- Role assignment happens in `createUser` only (admin allowlist from the environment) or through an admin action. The sign-in path never writes `role` or `status`.
- Database sessions mean a role change or deactivation applies on the next request, and "sign out everywhere" deletes the user's session documents.
- Idle expiry is 12 hours (sliding). An absolute limit of 7 days is enforced in the data-access layer by comparing `lastSignInAt`; older sessions are rejected and the user must sign in again.
- Cookies use the `__Host-` prefix in production (secure, path `/`, no domain).
- There is no credentials provider, no email provider, no guest or demo path, and no environment flag that creates one. CI includes a test that fails if any such route exists.
- Auth.js database sessions need the Node runtime, so the Edge runtime is not used for authenticated routes.
- Auth endpoints are rate limited (per IP and per account).

**Google setup:** a Web OAuth client, authorized redirect URI `https://<domain>/api/auth/callback/google`, scopes `openid email profile` only. Set the consent screen to production status and check Google's current rules for unverified apps.

## 6. Authorization

A single data-access layer (DAL) is the only place that touches the database from request handlers.

```ts
export async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) throw new HttpError(401);
  const user = await users.findOne({ _id: session.user.id });
  if (!user || user.status !== 'active') throw new HttpError(403);
  return user;                                  // role comes from the database
}
export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== 'admin') throw new HttpError(403);
  return user;
}
// Ownership is part of the query, never a separate check that can be forgotten.
export const getOwnedAgent = (ownerId: ObjectId, id: ObjectId) =>
  agents.findOne({ _id: id, ownerId });
```

**Rules**
- Middleware only redirects signed-out visitors. It is never the only check (a past Next.js middleware bypass, CVE-2025-29927, recalled from memory, is why).
- `ownerId` always comes from the session. No handler accepts an owner or user id from the request body.
- Admin routes call `requireAdmin()` and re-read the role from the database.
- Last-admin and self-demotion guards are implemented in the role-change handler and covered by tests.
- Missing or foreign resources return 404, not 403, to avoid confirming that ids exist.

**API keys (SDK and MCP)**
- Format `hl_live_<random 32 bytes, base62>`. Only the SHA-256 hash and an 8-character prefix are stored. Shown once at creation.
- Bound to one agent and a scope list (`read`, `ask`). Compared with a constant-time check.
- Last-used time and revocation state tracked. Revoked keys are refused immediately.
- The `/api/v1/*` namespace ignores cookies entirely, so CSRF does not apply there. It has its own rate limits.

## 7. Data model (MongoDB)

Auth.js adapter collections: `users`, `accounts`, `sessions`, `verification_tokens` (unused but created by the adapter). Application collections follow. All application documents have `createdAt`. All member-owned documents carry `ownerId`.

**`users`** (extends the adapter): `email`, `name`, `image`, `role` (`member` | `admin`), `status` (`active` | `suspended` | `deleted`), `lastSignInAt`. Unique index on `email`.

**`agents`**: `ownerId`, `name`, `mode` (`naive` | `halflife`), `walletAddress`, `walletKeyRef` (reference to the encrypted key document), `allowedIntents[]`, `policy` { `perAskCapUsdc`, `dailyCapUsdc`, `stakeDefault`, `escrowCapUsdc?` }, `status` (`active` | `paused`), `pausedBy?`. Index `{ownerId, createdAt}`.

**`wallet_keys`**: `agentId`, `ciphertext`, `nonce`, `wrappedDataKey`, `keyVersion`. No API route reads this collection. Only the worker's database user can read it.

**`api_keys`**: `agentId`, `ownerId`, `prefix`, `hash`, `scopes[]`, `lastUsedAt`, `revokedAt?`. Unique index on `hash`.

**`purchases`** (the ledger): `agentId`, `ownerId`, `intent`, `params`, `minerId`, `minerRank`, `priceUsdc`, `paymentMode` (`x402` | `escrow`), `txHash`, `signalHash`, `answer` (size-capped, schema-validated), `confidence?`, `askedAt`, `answeredAt`, `verification` (`pending` | `confirmed` | `failed`), `verifiedAt?`, `verifyDetail`. Unique index on `txHash`. Index `{ownerId, askedAt}`.

**`decisions`**: `agentId`, `ownerId`, `requestId`, `intent`, `stake`, `action` (`buy` | `reuse` | `escalate` | `refuse`), `reason`, `inputs` { `ageSeconds`, `drift`, `noiseFloor`, `price`, `calibrated` }, `purchaseId?`, `cacheEntryId?`, `createdAt`. Index `{ownerId, createdAt}`.

**`cache_entries`**: `ownerId`, `agentId`, `intent`, `paramsHash`, `purchaseId`, `answer`, `answeredAt`. Unique index `{agentId, intent, paramsHash}`. Reuse across different owners never happens.

**`atlas_samples`** (time-series collection if supported, otherwise a regular collection with a compound index on `{intent, ts}`) **[verify free-tier support]**: `ts`, `intent`, `paramsKey`, `minerId`, `valueNorm` (normalized numeric or category), `rawAnswerHash`, `purchaseId`, `priceUsdc`. Public, aggregated reads only.

**`atlas_stats`**: `intent`, `window`, `driftCurve[]` (age bucket to expected drift, monotone), `noiseFloor`, `sampleCount`, `computedAt`, `calibrated` (boolean).

**`jobs`**: `type`, `payload`, `status`, `lockedBy`, `lockedAt`, `attempts`, `error?`. Claimed with an atomic `findOneAndUpdate`. A stuck-job reaper requeues expired locks.

**`rate_limits`**: `key`, `windowStart`, `count`, TTL index on `expireAt`.

**`budget_counters`**: `agentId`, `period` (`yyyymmdd`), `spentUsdc`, TTL index. Updated atomically (see section 12).

**`audit_log`**: append-only (no update or delete permissions for the application user). `ts`, `actorType`, `actorId`, `action`, `target`, `ip` (truncated), `detail` (redacted).

**`benchmark_runs`**: `ownerId`, `config`, `window`, `results`, `evidencePackRef`.

**Schema validation:** each collection has a JSON Schema validator in addition to Zod at the application layer.

**Database users:** `web_app` (read/write on application collections, no access to `wallet_keys`, insert-only on `audit_log`), `worker` (read `wallet_keys`, read/write ledger, atlas, jobs), `admin_ops` (migrations, not used at runtime). Network access restricted by IP allowlist and TLS.

## 8. Telegraph integration

**Client interface** (in `packages/telegraph`):

```ts
interface TelegraphClient {
  listIntents(): Promise<Intent[]>;
  listMiners(intent: string): Promise<Miner[]>;                 // rank, score, price
  ask(req: { intent: string; params: unknown; maxPriceUsdc: number; payment: 'x402' | 'escrow' }): Promise<Receipt>;
}
```

- The MCP server's tools and the REST engine API are both candidate transports **[verify]**. The interface hides which is used.
- **Receipt fields we store** (names to be confirmed against real responses): miner, rank, price, settlement transaction hash, signal hash, latency, answer, timestamps.
- **Answer handling:** parse against a per-intent Zod schema, cap size, store as data. Anything that fails validation is kept as a failed purchase with the error, never rendered as HTML and never passed to a language model as instructions.
- **Verification step** (worker): after each purchase, read the transaction from Sepolia and check that the chain id, destination contract and token transfer amount match the reported price. Only then set `verification = confirmed`. Unverified purchases are excluded from benchmark numbers.
- **Failure modes handled:** payment failure, miner timeout, miner returns invalid schema, price above `maxPriceUsdc`, rank changes between listing and asking, node unreachable. Each has a decision-log entry and a test.
- **Idempotency:** each request has a `requestId`. A retry with the same id cannot create a second purchase.

## 9. Atlas sampler

- **Where:** worker, using a platform-owned system agent with its own wallet, caps and kill switch.
- **Schedule:** per-intent interval (initially 10 minutes, configurable). A MongoDB lock document ensures only one worker instance samples at a time.
- **Budget:** a daily spend cap on the sampler wallet. If the cap or the wallet balance is reached, the sampler pauses and the public page shows the gap.
- **Cost estimate:** 3 intents sampled every 10 minutes for 21 days is about 9,000 asks, around $90 if an ask costs $0.01. Lower the frequency if testnet funds are limited. Prices are **[verify]**.
- **Normalization:** numeric answers become relative values against a baseline; categorical answers become labels. The mapping is defined per intent and documented.
- **Pairs for noise floor:** at each sampling instant, buy from at least two distinct miners when available. Disagreement between them forms the noise-floor estimate (median absolute disagreement).
- **Drift curve:** for each age bucket, the median absolute (or change-probability) difference between an earlier answer and a later answer from the same miner, with an isotonic fit so the curve never decreases with age.
- **Gap handling:** missed samples are recorded as gaps, never interpolated into the published dataset.
- **Validation of the experiment:** an external public data source may be used to sanity-check results in the write-up. It is never used inside the product's decisions.

## 10. Governor decision engine

Pure function in `packages/governor`.

```ts
function decide(req, cached, stats, price): Decision {
  if (!cached) return buy('no cached answer');
  const age = req.now - cached.answeredAt;
  const drift = stats.expectedDrift(req.intent, age);      // relative error or P(change)
  const noise = stats.noiseFloor(req.intent);
  const staleLoss = req.stake * drift;                     // expected loss if reused
  if (!stats.calibrated) return conservativeWindow(req, cached, age);   // marked uncalibrated
  if (drift <= noise) return reuse('drift below the miners\' own disagreement');
  if (staleLoss <= price) return reuse('expected stale loss below price');
  return buy('expected stale loss exceeds price and drift exceeds noise');
}
```

- **Stake** is supplied by the caller or taken from the agent default (value at risk of acting on the answer).
- **Escalation (F-34):** buy a second independent miner when `stake x (1 - confidence) > price`. If the two answers differ by more than the noise floor, buy a third up to a per-request cap. Confidence availability **[verify]**.
- **Monotonicity property:** for fixed inputs, a larger age never makes the engine less likely to buy. This is a property test.
- **Cold start:** with fewer than N samples for an intent, use conservative fixed windows and mark every decision `calibrated: false`.
- **Safety:** the engine never decides to spend above caps. The cap check is separate and happens afterwards (section 12).

## 11. API surface

**Public (no auth, rate limited, cached):** `GET /api/public/atlas`, `GET /api/public/atlas/:intent`, `GET /api/public/dataset` (downloadable), `GET /api/health`.

**Session-authenticated (Member), under `/api/app/*`:** agents (create, list, update policy, pause, resume, delete), API keys (create, list, revoke), ledger (list, filter), decisions (list), benchmark runs (create, list, export evidence pack), account (delete, sign out everywhere). All validated with Zod, all scoped by the session's owner id, mutations check the Origin header.

**Admin (session, Admin role), under `/api/admin/*`:** users (list, change role, suspend), sampler (status, pause, resume), audit (list), agents (pause any).

**Agent (API key), under `/api/v1/*`:** `POST /ask`, `GET /ledger`, `GET /agents/me`. Cookies are ignored here.

## 12. Wallet and spending controls

**Wallet generation.** The worker generates one keypair per agent. The private key is encrypted with AES-256-GCM using a per-record data key. The data key is wrapped by a master key held in the host's secret store (or a cloud KMS if available). Only the address is returned to the web tier. Key material is never logged and never leaves the worker.

**Why custodial is acceptable here.** Testnet only, caps on every agent, and a clear notice. The mainnet path is non-custodial: a user-owned smart account with a session key that can only pay Telegraph's contract, with a daily limit.

**Three layers of spending limits**
1. **Application policy (atomic).** Before any payment the worker reserves the amount:
   ```ts
   const r = await budgets.updateOne(
     { agentId, period, spentUsdc: { $lte: dailyCap - amount } },
     { $inc: { spentUsdc: amount } }, { upsert: true });
   if (r.modifiedCount + r.upsertedCount !== 1) throw new CapExceeded();
   ```
   A per-ask cap is checked first. A failed purchase releases its reservation.
2. **Escrow balance.** The agent only holds a capped balance in Telegraph's escrow **[verify]**, so the chain itself limits exposure.
3. **Optional on-chain policy (F-60).** A smart account or session key limited to Telegraph's contract with a daily cap.

**Kill switch.** The worker checks `agents.status` and the sampler flag immediately before signing, not only at job start.

## 13. Security controls

**Headers (set in Next.js config)**
- `Content-Security-Policy`: `default-src 'self'; script-src 'self' 'nonce-<per-request>'; style-src 'self' 'nonce-<per-request>'; img-src 'self' data: https://lh3.googleusercontent.com; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self' https://accounts.google.com` (if sign-in fails under CSP, adjust `form-action`; browsers may enforce it on redirects).
- `Strict-Transport-Security: max-age=63072000; includeSubDomains`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` denying unused features, `Cross-Origin-Opener-Policy: same-origin`.

**Input and injection**
- Zod schemas on every route and server action, with `.strict()` objects so unknown fields are rejected.
- Strings used in queries are validated as plain strings. Any object with keys beginning with `$` is rejected before it reaches the driver.
- Request body size limits per route. Pagination limits on list routes.
- No user-supplied URLs are fetched anywhere (no server-side request forgery surface). Intent names are matched against an allowlist.

**Rate limiting.** Fixed-window counters in `rate_limits` (TTL). Keys: IP, user id, API key id. Stricter limits on sign-in, key creation, and anything that can spend money. For higher scale, move to a dedicated store.

**Logging and privacy.** Structured logs with request id. Redact tokens, keys and emails where not needed. Audit log is append-only for the application database user. Retention configurable.

**Secrets.** Validated at boot with Zod. Missing or short secrets in production stop the process. No fallbacks. A CI step scans for committed secrets and for high-entropy strings in the diff.

**Supply chain.** `packageManager` pinned in `package.json`. CI and Vercel install with `npx --yes pnpm@<pinned> install --frozen-lockfile` so no other pnpm on the path can be used. No other lockfiles are committed. Dependabot enabled. New package versions published within the last two weeks are reviewed before adoption.

**Threat model**

| Asset | Threat | Control |
|-------|--------|---------|
| Member accounts | Account takeover | Google-only sign-in, verified email, database sessions, revocation, secure cookies |
| Roles | Privilege escalation | Role set only at creation or by admin, DAL re-reads role, last-admin guard |
| Other users' data | IDOR | Ownership in every query, 404 for foreign ids, tests for every route |
| Agent wallets | Key theft | Encryption at rest, worker-only decryption, no API read path, testnet only |
| Funds | Overspend | Atomic caps, escrow cap, kill switch checked before signing |
| Funds | Signing the wrong transaction | Chain guard: chain id, destination allowlist, exact-amount approvals |
| Ledger | Fake or unverified purchases | On-chain verification before `confirmed` |
| App | Injection (NoSQL, XSS) | Strict schemas, operator rejection, React escaping, CSP with nonces, no raw HTML |
| App | CSRF | SameSite cookies, Origin checks, no state-changing GET, API namespace ignores cookies |
| API keys | Leak or brute force | Hashed storage, 256-bit random, constant-time compare, rate limits, revocation |
| Sampler budget | Abuse or runaway cost | Daily cap, kill switch, admin visibility, no public trigger |
| Cost endpoints | Unauthenticated amplification | `ask` needs an API key and a spend cap; no public route can cause a purchase |
| Data | Database exposure | TLS, IP allowlist, least-privilege users, no secrets in repo |
| Miner answers | Malicious content or prompt injection | Schema validation, size caps, never executed, never used as instructions |
| Deploy | Wrong toolchain or stale lockfile | Pinned pnpm via `npx`, frozen lockfile, single lockfile |

## 14. Frontend implementation notes

- Design tokens as CSS variables in `:root`, matching PRD section 7.1. `color-scheme: light`.
- Poppins loaded with `next/font/local` from files in the repository (no build-time call to Google Fonts). Weights 400, 500, 600. Keep the font license file.
- Components: Button (primary black on cream text, secondary outlined), Input, Table, Badge for status, Notice (testnet banner), Empty and Error states, Skeleton only for real async content.
- Focus: 2px solid black ring with 2px offset on every interactive element.
- Landing page numbers and tables are fetched from the real database on the server. If a number cannot be shown truthfully, the section shows "collecting since" with counts, or is omitted.
- Login page contains exactly one action. Its error messages come from a fixed allowlist of codes.

## 15. Observability and operations

- Pino structured logs, request ids, `/api/health` (database ping), worker heartbeat document updated every minute, admin page showing last successful sample per intent and any gaps.
- Error tracking (for example Sentry) with PII scrubbing.
- Alerts when the sampler misses more than N intervals or a wallet balance is low.
- MongoDB Atlas backups enabled. A restore is tested once.

## 16. Deployment

- **Web:** Vercel project with root directory `apps/web`. Install command: `cd ../.. && npx --yes pnpm@<pinned> --version && npx --yes pnpm@<pinned> install --frozen-lockfile`. Build command: `cd ../.. && npx --yes pnpm@<pinned> --filter "@half-life/web..." build`. Set Node.js to 22.x. The printed version line shows which pnpm actually ran.
- **Worker:** container on a small VM or container host, restart policy, no inbound ports (it only makes outbound connections to MongoDB, the Sepolia RPC and Telegraph).
- **Database:** MongoDB Atlas with TLS and an IP allowlist. Vercel's outbound addresses are not fixed, so rely on strong credentials, TLS and least-privilege users for the web app user, and use Atlas private networking if the plan allows.
- **Environments:** production and preview. Preview deployments never receive production secrets or production database credentials.

**Environment variables (validated at boot)**

| Variable | Used by | Notes |
|----------|---------|-------|
| `AUTH_SECRET` | web | at least 32 random bytes |
| `AUTH_URL` | web | canonical site URL |
| `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` | web | Google OAuth client |
| `ADMIN_EMAILS` | web | comma-separated, honored only at account creation |
| `MONGODB_URI_WEB`, `MONGODB_URI_WORKER` | web, worker | separate least-privilege users |
| `DB_NAME` | both | |
| `KEY_ENCRYPTION_KEY` | worker | 32 bytes, base64, or a KMS reference |
| `CHAIN_ID`, `TELEGRAPH_CONTRACT`, `TELEGRAPH_NODE_URL`, `SEPOLIA_RPC_URL`, `USDC_ADDRESS` | worker (and web read-only for display) | **[verify]** values |
| `SAMPLER_DAILY_CAP_USDC` | worker | |
| `ERROR_TRACKING_DSN` | both | optional |

## 17. Testing strategy

**Unit and property tests**
- Governor: table-driven cases, monotonicity property, cold-start behavior, cap interplay.
- Atlas statistics: drift curve monotonicity, noise-floor estimation on synthetic data with known parameters.
- Chain guard: wrong chain, wrong contract, wrong amount, unlimited approval all rejected.
- Budget reservation: concurrent reservations never exceed the cap.

**Security tests (in CI)**
- Authorization matrix: every route against Visitor, Member, Admin, API key, and a second Member (IDOR).
- Role stability: signing in again never changes role or status.
- Absence test: no demo, guest, credentials or dev-login route exists.
- NoSQL injection: operator payloads rejected on every route that accepts strings.
- Rate limits trigger on auth, key creation and `ask`.
- API key: hash-only storage, revocation takes effect immediately, cookie is ignored on `/api/v1`.
- Secrets: app refuses to boot without required secrets in production mode.
- Headers: CSP and other headers present.
- Atomic claim: two workers cannot take the same job or double-spend a reservation.

**Integration and end-to-end**
- Mock Telegraph client for deterministic flows, plus a live Sepolia smoke test run manually.
- Playwright smoke tests: landing renders, login page has exactly one sign-in action, signed-in dashboard flow with a test Google configuration in a non-production environment that is isolated from production data.
- Benchmark replay reproduces the same numbers from stored data.

**Definition of done (P0 items):** code merged, tests passing, audit events emitted, authorization covered by a test, documented in the README.

## 18. Open technical questions

- Exact Telegraph payment path (x402 or escrow) and whether it can run from a server-side worker.
- USDC contract and escrow contract addresses for Sepolia, and whether an escrow balance cap can be set.
- Answer format, timestamp, confidence fields, and per-intent schemas.
- Whether miner prices differ, and how ranking is exposed.
- Whether the node endpoint supports TLS.
- Whether Atlas free tier supports time-series collections.
- Whether faucets supply enough Sepolia ETH and USDC for the sampler.
- Terms on reusing purchased answers.
