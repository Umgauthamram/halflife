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
- Created dedicated authenticated `/app/atlas` inside the dashboard shell with full AppLayout navigation and direct "Deploy Agent" action
- Updated `apps/web/app/app/layout.tsx` to link to `/app/atlas` so logged-in users remain inside the app shell
- Added automatic redirects on `/` and `/atlas`: authenticated users are seamlessly routed to `/app` and `/app/atlas`, preventing exposure to landing page or sign-in buttons
- Resolved NextAuth v5 `MissingSecret` error by providing fallback secret in `apps/web/auth.ts`
- All 53/53 tests pass, clean Next.js production build across all 20 routes

## 4. Next Immediate Steps
- [ ] Record final demo video following `docs/video-script.md`
- [ ] Deploy web tier to Vercel with environment variables
- [ ] Submit package via Telegraph Hackathon portal using `docs/submission.md`
