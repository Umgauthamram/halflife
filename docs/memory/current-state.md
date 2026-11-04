# Current Project State

## 1. System Overview & Purpose
- **Project Name**: halflife
- **Active Branch**: `main`
- **Detected Stack & Architecture**: pnpm Monorepo (Next.js App Router, Node Worker, Viem, MongoDB, Tailwind v4 + PostCSS)
- **Primary Purpose**: Half-Life - Answer decay measurement and decision engine for Telegraph (Hackathon Season II Track 03)
- **Languages**: TypeScript

## 2. Active Feature / Milestone
- **Current Focus**: Phase 2 & 3 Worker Systems, Sampler & Agent Dashboard
- **Status**: Complete & Verified

## 3. Recent Progress (Rolling Snapshot - Max 5)
- Implemented AES-256-GCM envelope encryption for agent wallet private keys in worker (`crypto.ts` & `wallet.ts`)
- Implemented atomic budget reservation (`budget.ts`) enforcing per-ask caps, daily caps, and kill switches
- Built Freshness Atlas Sampler engine (`sampler.ts`) measuring 2-miner disagreement (noise floor) and gap logging
- Built Authenticated Dashboard Shell (`/app`, `/app/agents`, `/app/agents/new`) and Public Freshness Atlas page (`/atlas`)
- All 35 tests across 6 test suites passing (Governor, Chain Guard, Telegraph, Auth Absence, DAL, Worker Crypto/Budget/Sampler)

## 4. Next Immediate Steps
- [ ] Connect `/api/v1/ask` implementing decide -> reserve -> buy -> verify -> store pipeline
- [ ] Implement API key management (hash-only storage, 256-bit keys, show-once, instant revocation)
- [ ] Build side-by-side replay benchmark harness (`packages/bench`)
