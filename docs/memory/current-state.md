# Current Project State

## 1. System Overview & Purpose
- **Project Name**: halflife
- **Active Branch**: `main`
- **Detected Stack & Architecture**: pnpm Monorepo (Next.js App Router, Node Worker, Viem, MongoDB, Tailwind v4 + PostCSS)
- **Primary Purpose**: Half-Life - Answer decay measurement and decision engine for Telegraph (Hackathon Season II Track 03)
- **Languages**: TypeScript

## 2. Active Feature / Milestone
- **Current Focus**: Mission 09 Personal Agent Integration, ClawHub Skill & Live Spend Leaderboard
- **Status**: Complete & Production-Verified

## 3. Recent Progress (Rolling Snapshot - Max 5)
- Implemented ClawHub skill (`openclaw-half-life-governor`) in `@half-life/sdk` and `skills/openclaw/SKILL.md` wiring Telegraph into OpenClaw 24/7 heartbeat loops
- Built Live Agent Spend Leaderboard (`/app/leaderboard`) tracking on-chain settlements, requests, and verified transaction proofs
- Integrated verified Sepolia transaction (`0x5b7bfd33ec11444a07117ac480f73eb8b7b5d73e7d50ec3642ddb31107845742`) and operator wallet `0xB980b2dBA0004e12f8efF99E5978aB1fa8179517`
- Configured live Telegraph node `http://13.237.89.59:7148` (`wss://13.237.89.59:7148/ws`) and expanded schemas for `WEB_SEARCH`, `QUESTION_ANSWERING`, `WEATHER_CHECK`, `CRYPTO_PRICE`
- 53/53 tests passing across all 8 workspace packages, all 19 Next.js routes compiled cleanly

## 4. Next Immediate Steps
- [ ] Record final demo video following `docs/video-script.md`
- [ ] Deploy web tier to Vercel with environment variables
- [ ] Submit package via Telegraph Hackathon portal using `docs/submission.md`
