# Current Project State

## 1. System Overview & Purpose
- **Project Name**: halflife
- **Active Branch**: `main`
- **Detected Stack & Architecture**: pnpm Monorepo (Next.js App Router, Node Worker, Viem, MongoDB, Tailwind v4 + PostCSS)
- **Primary Purpose**: Half-Life - Answer decay measurement and decision engine for Telegraph (Hackathon Season II Track 03)
- **Languages**: TypeScript

## 2. Active Feature / Milestone
- **Current Focus**: Phase 1 Foundation & Monorepo Scaffold
- **Status**: Complete & Verified

## 3. Recent Progress (Rolling Snapshot - Max 5)
- Created ADR 0001 (`docs/memory/decisions/0001-monorepo-pnpm-architecture.md`)
- Migrated Next.js app from `site/` to `apps/web/` in a `pnpm` monorepo workspace
- Created `.env.example` with full configuration for Auth.js, MongoDB, Viem/Sepolia, Telegraph, and Sampler
- Built `@half-life/shared` (Zod schemas and strict env validation) and `@half-life/governor` (pure decision engine with 8 passing Vitest tests)
- Implemented design system tokens (cream `#F6F0E2`, surface `#FBF7EE`, black `#111111`) and verified web production build

## 4. Next Immediate Steps
- [ ] Connect Auth.js v5 with Google OpenID Connect in `apps/web`
- [ ] Implement MongoDB connection and Data Access Layer (DAL) with role-based authorization
- [ ] Phase 0 / 2: Implement Telegraph client and Viem chain guard in `packages/chain` and `packages/telegraph`
