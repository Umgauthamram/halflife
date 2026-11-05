# Project Tasks & Milestones

## Active Tasks
- [x] Bootstrap foundational architecture & core dependencies (pnpm monorepo)
- [x] Configure environment variables & local development setup (.env.example)
- [x] Implement initial core features (Governor decision engine & design tokens)
- [x] Connect Auth.js v5 Google provider & database sessions
- [x] Implement MongoDB DAL with user role enforcement and owner scoping
- [x] Implement Viem chain guard and Telegraph client
- [x] Implement Worker wallet generation with envelope encryption
- [x] Implement atomic budget reservation and Atlas sampler runner
- [x] Build Agent dashboard UI (/app, /app/agents, /app/agents/new, /atlas)
- [x] Implement /api/v1/ask endpoint with complete Governor execution pipeline
- [x] Implement Agent API Key generation & verification
- [x] Build Purchase Ledger (/app/ledger) and Decisions Explorer (/app/decisions)
- [x] Implement Replay benchmark harness & evidence pack exporter (packages/bench)
- [x] Build Replay Benchmarks UI page (/app/benchmarks)
- [x] Build Admin Management pages (/app/admin/users, /app/admin/sampler, /app/admin/audit)
- [x] Implement Public TypeScript SDK & MCP Server wrapper (packages/sdk)
- [x] Set up Continuous Integration workflow (.github/workflows/ci.yml)
- [x] Configure strict security headers & production environment boot tests
- [x] Author comprehensive project README, developer tutorial, and Gate 0 documentation
- [x] Author complete 2-5 minute video production script and storyboard (docs/video-script.md)
- [x] Author official Hackathon Submission Package with five-question commercial summary (docs/submission.md)
- [x] Author Empirical Decay Findings & Measurement Report (docs/findings.md)
- [x] Implement Merkle dataset anchoring and Sequential checks early stopping

## Backlog
- [x] Comprehensive test suite (53/53 passing unit, property, and absence tests across 8 suites)
- [x] Full production build of all 18 web routes and 8 workspace packages
- [ ] Connect live Sepolia testnet credentials for unattended sampling
- [ ] Production deployment to Vercel (web) and container host (worker)
