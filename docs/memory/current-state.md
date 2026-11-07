# Current Project State

## 1. System Overview & Purpose
- **Project Name**: halflife
- **Active Branch**: `main`
- **Detected Stack & Architecture**: pnpm Monorepo (Next.js App Router, Node Worker, Viem, MongoDB, Tailwind v4 + PostCSS)
- **Primary Purpose**: Half-Life - Answer decay measurement and decision engine for Telegraph (Hackathon Season II Track 03)
- **Languages**: TypeScript

## 2. Active Feature / Milestone
- **Current Focus**: Cloned Wise Design System & Layout for Landing Page (`landingpage.md`)
- **Status**: Complete & Production-Verified

## 3. Recent Progress (Rolling Snapshot - Max 5)
- Cloned Wise design system from `landingpage.md` into `apps/web/app/page.tsx` with Forest Ink (`#163300`), Lime Voltage (`#9fe870`), and Paper (`#ffffff`) surfaces
- Built Wise display headlines, top navigation with segmented switcher, interactive transfer calculator on Fog (`#e8ebe6`), 3-column feature row, dark inverted card, 5-column country directory, and floating QR badge
- Expanded layout to full screen width and removed explicit testnet labels across UI
- Fixed Auth.js v5 database isolation (`databaseName: "halflife"`) and added self-healing user status in DAL
- 53/53 tests passing across all packages, production build succeeded across all 19 routes, pushed to `origin main`

## 4. Next Immediate Steps
- [ ] Record final demo video following `docs/video-script.md`
- [ ] Deploy web tier to Vercel with environment variables
- [ ] Submit package via Telegraph Hackathon portal using `docs/submission.md`
