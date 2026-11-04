# Current Project State

## 1. System Overview & Purpose
- **Project Name**: halflife
- **Active Branch**: `main`
- **Detected Stack & Architecture**: pnpm Monorepo (Next.js App Router, Node Worker, Viem, MongoDB, Tailwind v4 + PostCSS)
- **Primary Purpose**: Half-Life - Answer decay measurement and decision engine for Telegraph (Hackathon Season II Track 03)
- **Languages**: TypeScript

## 2. Active Feature / Milestone
- **Current Focus**: Phase 3 Governor Execution Pipeline, API Keys, & Ledger/Decisions Explorers
- **Status**: Complete & Verified

## 3. Recent Progress (Rolling Snapshot - Max 5)
- Implemented `/api/v1/ask` executing the complete Governor pipeline (auth, idempotency, kill switch, cache lookup, decision, atomic reservation, buy, ledger write)
- Built API key security utilities (`api-key.ts`) with 256-bit entropy, SHA-256 hash-only storage, and timing-safe verification
- Built Purchase Ledger Explorer (`/app/ledger`) with Sepolia Etherscan transaction links and verification badges
- Built Governor Decisions Explorer (`/app/decisions`) showing mathematical rationale, drift, age, and noise floors
- 36/36 tests passing across all workspace packages and clean Next.js production build

## 4. Next Immediate Steps
- [ ] Build side-by-side replay benchmark harness and evidence pack exporter (`packages/bench`)
- [ ] Implement Admin management pages (`/app/admin/users`, `/app/admin/sampler`, `/app/admin/audit`)
- [ ] Phase 0 live Sepolia contract integration verification
