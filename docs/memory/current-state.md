# Current Project State

## 1. System Overview & Purpose
- **Project Name**: halflife
- **Active Branch**: `main`
- **Detected Stack & Architecture**: pnpm Monorepo (Next.js App Router, Node Worker, Viem, MongoDB, Tailwind v4 + PostCSS)
- **Primary Purpose**: Half-Life - Answer decay measurement and decision engine for Telegraph (Hackathon Season II Track 03)
- **Languages**: TypeScript

## 2. Active Feature / Milestone
- **Current Focus**: Phase 1 & 2 Core Systems (Auth.js, DAL, Chain Guard, Telegraph Client)
- **Status**: Complete & Verified

## 3. Recent Progress (Rolling Snapshot - Max 5)
- Configured Auth.js v5 with Google-only provider, MongoDB database sessions, and admin allowlist role assignment
- Implemented Data Access Layer (`lib/dal.ts`) with owner-scoped queries, self-demotion prevention, and last-admin guards
- Built `/login` page per PRD specs (cream theme, Google-only action, testnet notice) and draft `/terms` and `/privacy`
- Built `@half-life/chain` (Viem chain guard enforcing Sepolia chain ID 11155111, destination allowlists, and rejecting unlimited approvals)
- Built `@half-life/telegraph` with schema validation for targeted intents and idempotent client execution (24/24 workspace tests passing)

## 4. Next Immediate Steps
- [ ] Implement Worker wallet generation with AES-256-GCM envelope encryption
- [ ] Implement atomic budget reservation (`budgets.updateOne`) and sampler loop in `apps/worker`
- [ ] Build Agent management dashboard UI in `apps/web/app/app/`
