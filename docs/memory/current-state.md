# Current Project State

## 1. System Overview & Purpose
- **Project Name**: halflife
- **Active Branch**: `main`
- **Detected Stack & Architecture**: pnpm Monorepo (Next.js App Router, Node Worker, Viem, MongoDB, Tailwind v4 + PostCSS)
- **Primary Purpose**: Half-Life - Answer decay measurement and decision engine for Telegraph (Hackathon Season II Track 03)
- **Languages**: TypeScript

## 2. Active Feature / Milestone
- **Current Focus**: Full Wise.com Clone (Interactive Currency Calculator & Wise Design System)
- **Status**: Complete & Production-Verified

## 3. Recent Progress (Rolling Snapshot - Max 5)
- Completed authentic Wise.com clone on `apps/web/app/page.tsx` using exact tokens from `landingpage.md`
- Built interactive multi-currency transfer calculator with dynamic currency switching (USD, GBP, EUR, AUD, CAD, INR, JPY), fee breakdown tree, real exchange rate calculations, and savings callout
- Implemented Wise layout rhythm: Sticky 64px header, 2-column split hero, Trustpilot rating badge, global stats marquee ($120B+ transferred), 3-column feature row, dark inverted multi-currency account card, Wise debit card section, 5-column country directory grid (15 flags), Wise Business tier, FAQ accordion, and floating bottom-right QR badge
- Maintained all existing app pathways (`/login`, `/app`) with smooth Google Auth and session recovery
- Verified 53/53 tests pass and production build compiles all 19 routes cleanly; deployed to `main`

## 4. Next Immediate Steps
- [ ] Record final demo video following `docs/video-script.md`
- [ ] Deploy web tier to Vercel with environment variables
- [ ] Submit package via Telegraph Hackathon portal using `docs/submission.md`
