# Current Project State

## 1. System Overview & Purpose
- **Project Name**: halflife
- **Active Branch**: `main`
- **Detected Stack & Architecture**: pnpm Monorepo (Next.js App Router, Node Worker, Viem, MongoDB, Tailwind v4 + PostCSS)
- **Primary Purpose**: Half-Life - Answer decay measurement and decision engine for Telegraph (Hackathon Season II Track 03)
- **Languages**: TypeScript

## 2. Active Feature / Milestone
- **Current Focus**: Phase 4 Replay Benchmark & Evidence Pack Exporter
- **Status**: Complete & Verified

## 3. Recent Progress (Rolling Snapshot - Max 5)
- Built `@half-life/bench` (`simulator.ts`) implementing side-by-side simulation comparing Naive Agent vs Half-Life Governor
- Implemented Evidence Pack exporter (`evidence-pack.ts`) generating cryptographically referenced bundles with Sepolia links
- Created one-command CLI runner (`pnpm replay`) displaying live comparison tables and metrics
- Built Replay Benchmarks UI page (`/app/benchmarks`) with KPI cards, comparative schedules, and raw bundle preview
- All 38 tests across 7 workspace packages passing (100% success rate) and full production build passing

## 4. Next Immediate Steps
- [ ] Build Admin Management pages (`/app/admin/users`, `/app/admin/sampler`, `/app/admin/audit`)
- [ ] Phase 0 live Sepolia contract integration verification with user credentials
