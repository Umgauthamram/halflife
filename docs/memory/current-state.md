# Current Project State

## 1. System Overview & Purpose
- **Project Name**: halflife
- **Active Branch**: `main`
- **Detected Stack & Architecture**: pnpm Monorepo (Next.js App Router, Node Worker, Viem, MongoDB, Tailwind v4 + PostCSS)
- **Primary Purpose**: Half-Life - Answer decay measurement and decision engine for Telegraph (Hackathon Season II Track 03)
- **Languages**: TypeScript

## 2. Active Feature / Milestone
- **Current Focus**: Half-Life Landing Page with Caldera Stepped Halftone Hero Layout
- **Status**: Complete & Production-Verified

## 3. Recent Progress (Rolling Snapshot - Max 5)
- Rebuilt landing page with exact Caldera hero stepped halftone layout from user reference screenshot
- Incorporated Half-Life core content: "The Internet Of Freshness", empirical answer decay on Telegraph, Governor algorithm, and ClawHub skill for autonomous personal agents
- Updated branding and navigation: switched logo emblem to Star icon (`★`), removed social media links/icons, and removed Leaderboard from landing page
- Resolved NextAuth v5 `MissingSecret` error by providing fallback secret in `apps/web/auth.ts`
- All 53/53 tests pass, clean Next.js production build across all 19 routes, verified on `origin/main`

## 4. Next Immediate Steps
- [ ] Record final demo video following `docs/video-script.md`
- [ ] Deploy web tier to Vercel with environment variables
- [ ] Submit package via Telegraph Hackathon portal using `docs/submission.md`
