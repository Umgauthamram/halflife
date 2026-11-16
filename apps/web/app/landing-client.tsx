"use client";

import Link from "next/link";
import { useState } from "react";

export default function HalfLifeLandingPage() {
  const [emailInput, setEmailInput] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [demoScenario, setDemoScenario] = useState<"initial" | "reuse" | "compliance">("initial");

  const DEMO_SCENARIOS = {
    initial: {
      id: "initial",
      title: "1. Fresh Ask (Cache Miss)",
      badge: "Decision: BUY",
      badgeColor: "bg-emerald-600 text-white",
      intent: "FX_NOW",
      stake: 500,
      query: "Check EUR/USD rate before settling $500 cross-border transfer",
      action: "buy" as const,
      reason: "No cached answer exists for EURUSD. Dispatched fresh purchase to top Telegraph miner on Sepolia.",
      cost: "$0.010 USDC",
      saved: "$0.000",
      latency: "1,156ms",
      drift: "0.00000",
      noiseFloor: "0.0000",
      payload: { pair: "EURUSD", rate: 1.0854, timestamp: 1794170246 },
      proof: "0x13522a15fd5bf7c67406bbd63e118b7aba4677d29229ca4a89f91f4552b976f0",
      explanation: "The first time an agent requests an intent, the Governor buys from Telegraph miners and commits the verified answer to cache.",
    },
    reuse: {
      id: "reuse",
      title: "2. Polling 3s Later (Cache Hit)",
      badge: "Decision: REUSE",
      badgeColor: "bg-blue-600 text-white",
      intent: "FX_NOW",
      stake: 500,
      query: "Agent polls EUR/USD again 3 seconds later for real-time heartbeat check",
      action: "reuse" as const,
      reason: "Expected drift (0.00000) is within the miner noise floor (0.0000). Re-purchasing adds zero net intelligence.",
      cost: "$0.000 USDC",
      saved: "$0.010 USDC (100% Saved)",
      latency: "2ms",
      drift: "0.00000",
      noiseFloor: "0.0000",
      payload: { pair: "EURUSD", rate: 1.0854, cached: true },
      proof: "0x13522a15fd5bf7c67406bbd63e118b7aba4677d29229ca4a89f91f4552b976f0",
      explanation: "Instead of paying $0.010 again, the Governor serves the cached rate in 2ms for $0.00. Across 86,400 daily polls, this saves $864/day!",
    },
    compliance: {
      id: "compliance",
      title: "3. High-Stake Compliance Check",
      badge: "Decision: BUY",
      badgeColor: "bg-emerald-600 text-white",
      intent: "SANCTIONS_SCREENING_MATCH",
      stake: 10000,
      query: "Screen entity 'Acme International' against OFAC sanctions database before clearing $10,000 transfer",
      action: "buy" as const,
      reason: "High compliance stake ($10,000) compresses acceptable drift tolerance. Fresh cryptographic screening required.",
      cost: "$0.010 USDC",
      saved: "$0.000",
      latency: "840ms",
      drift: "0.00000",
      noiseFloor: "0.0020",
      payload: { entity: "Acme International", status: "CLEAR", ofacListVersion: "2026-11-10" },
      proof: "0x78a1bc92e44f801bc93411a098ef32470129bc4891a27e7f80b91cb45a9018e4",
      explanation: "When financial loss from stale data exceeds the ask price, the Governor forces a fresh buy to protect high-value transactions.",
    },
  };

  const stats = [
    { value: "300s", label: "AVERAGE FX DRIFT HALF-LIFE" },
    { value: "64%", label: "REDUNDANT SPENDS PREVENTED" },
    { value: "100%", label: "ON-CHAIN MERKLE VERIFIED" },
    { value: "3", label: "TARGET AGENTS (OPENCLAW, HERMES, KIMI)" },
  ];

  const intents = [
    "FX_NOW",
    "WEATHER_CHECK",
    "CRYPTO_PRICE",
    "WEB_SEARCH",
    "QUESTION_ANSWERING",
    "TASK_EXECUTION_QUALITY",
    "SANCTIONS_SCREENING",
  ];

  const steps = [
    {
      num: "01",
      title: "MEASURE",
      subtitle: "Freshness Atlas",
      desc: "Samples Telegraph miners continuously to establish empirical drift curves and miner noise floors across all intents.",
    },
    {
      num: "02",
      title: "DECIDE",
      subtitle: "The Governor",
      desc: "Evaluates risk in real-time: re-buys intelligence only when Expected Stale Loss (Stake × Drift) exceeds the answer price.",
    },
    {
      num: "03",
      title: "CAP",
      subtitle: "Atomic Spending Limits",
      desc: "Multi-layer spending controls: per-ask caps, daily allowances, and cryptographic signing guards before transactions.",
    },
    {
      num: "04",
      title: "PROVE",
      subtitle: "On-Chain Settlement",
      desc: "Every purchase is cryptographically confirmed on Ethereum Sepolia with verified Merkle roots and audit receipts.",
    },
  ];

  const showcaseCards = [
    {
      intent: "FX_NOW",
      category: "FINANCIAL DATA",
      decay: "300s Window",
      headline: "Real-time institutional foreign exchange mid-market rates & currency spreads.",
      target: "Latency < 200ms",
    },
    {
      intent: "WEATHER_CHECK",
      category: "DETERMINISTIC SENSORS",
      decay: "3,600s Window",
      headline: "Verified current atmospheric conditions and localized meteorological observations.",
      target: "Deterministic Ground Truth",
    },
    {
      intent: "SANCTIONS_SCREENING",
      category: "COMPLIANCE & RISK",
      decay: "86,400s Window",
      headline: "Continuous validation against OFAC sanctions, PEP monitors, and enforcement databases.",
      target: "Zero-Stale Tolerance",
    },
  ];

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (emailInput.trim()) {
      setSubscribed(true);
    }
  };

  return (
    <div className="min-h-screen bg-[#e2e2df] text-[#070607] font-sans antialiased selection:bg-[#fc5000] selection:text-white">
      {/* Top Floating Nav Pill (Exact match to screenshot) */}
      <header className="sticky top-6 z-50 px-4 sm:px-6 max-w-[1280px] mx-auto w-full">
        <nav className="flex items-center justify-between rounded-[800px] bg-white px-5 sm:px-7 py-3 border border-[#070607]/10 shadow-sm">
          {/* Logo Lockup with Star Icon */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="h-6 w-6 rounded-md bg-[#fc5000] flex items-center justify-center text-white">
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            </div>
            <span className="text-xl font-black tracking-tight text-[#070607] uppercase">
              HALF-LIFE
            </span>
          </Link>

          {/* Dotted Divider & Nav Links */}
          <div className="hidden md:flex items-center">
            <span className="h-5 w-[1.5px] border-r-[1.5px] border-dotted border-[#070607]/40 mr-6" />
            <div className="flex items-center gap-7 text-[15px] font-medium text-[#070607]">
              <Link href="/atlas" className="hover:text-[#fc5000] transition">
                Atlas
              </Link>
              <Link href="#engine" className="hover:text-[#fc5000] transition">
                Governor
              </Link>
              <Link href="#demo" className="hover:text-[#fc5000] transition">
                Demo
              </Link>
              <Link href="#sdk" className="hover:text-[#fc5000] transition">
                Docs
              </Link>
            </div>
          </div>

          {/* Right Action */}
          <div className="flex items-center">
            {/* Orange Primary Pill Button */}
            <Link
              href="/login"
              className="rounded-full bg-[#fc5000] px-6 py-2.5 text-sm font-semibold text-white hover:opacity-90 active:scale-98 transition shadow-sm"
            >
              Get Started
            </Link>
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex flex-col gap-20 pt-8 pb-20 px-4 sm:px-6 max-w-[1280px] mx-auto w-full">
        {/* HERO SECTION — EXACT CALDERA STEPPED HALFTONE GEOMETRY FROM SCREENSHOT */}
        <section className="relative rounded-[40px] overflow-hidden bg-[#524ae9] min-h-[580px] lg:min-h-[640px] flex flex-col justify-between border border-[#070607]/15 shadow-sm">
          {/* Authentic Halftone Dot Pattern Overlay (Violet base with glowing Orange dot clusters) */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundColor: "#524ae9",
              backgroundImage: `
                radial-gradient(circle at 75% 35%, #fc5000 0%, #fc5000 45%, transparent 75%),
                radial-gradient(circle at 20% 75%, #fc5000 0%, #fc5000 35%, transparent 65%),
                radial-gradient(circle at 12px 12px, #fc5000 2.5px, transparent 3px)
              `,
              backgroundSize: "100% 100%, 100% 100%, 20px 20px",
              backgroundBlendMode: "color, screen, normal",
            }}
          />

          {/* Stepped Row 1: Top Headline (Left Cutout) + Halftone Ribbon (Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 relative z-10">
            {/* Top-Left Headline Box on Canvas (#e2e2df) with 40px bottom-right curve */}
            <div className="lg:col-span-6 bg-[#e2e2df] p-8 sm:p-12 lg:p-14 lg:rounded-br-[40px] flex flex-col justify-center">
              <h1 className="text-5xl sm:text-7xl lg:text-[76px] xl:text-[84px] font-black uppercase tracking-tight text-[#070607] leading-[0.95]">
                The Internet<br />Of Freshness
              </h1>
            </div>

            {/* Top-Right Area: Halftone graphic shows through */}
            <div className="hidden lg:block lg:col-span-6" />
          </div>

          {/* Stepped Row 2: Halftone Ribbon (Left) + Bottom Description Card (Right Cutout) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 relative z-10 mt-auto">
            {/* Bottom-Left Area: Halftone graphic shows through */}
            <div className="hidden lg:block lg:col-span-6" />

            {/* Bottom-Right Description Card on Canvas (#e2e2df) with 40px top-left curve */}
            <div className="lg:col-span-6 bg-[#e2e2df] p-8 sm:p-12 lg:p-14 lg:rounded-tl-[40px] flex flex-col justify-end">
              <p className="text-base sm:text-lg font-medium text-[#070607] leading-relaxed mb-8 max-w-xl">
                Half-Life is a network of autonomous freshness governors, measuring empirical answer decay on Telegraph so agents re-buy intelligence only when stale risk exceeds market price.
              </p>

              {/* Action Buttons matching screenshot */}
              <div className="flex flex-wrap items-center gap-4">
                <Link
                  href="/atlas"
                  className="rounded-full bg-[#fc5000] px-8 py-3.5 text-sm sm:text-base font-bold text-white hover:opacity-90 active:scale-98 transition shadow-sm"
                >
                  Explore Atlas
                </Link>

                <Link
                  href="/login"
                  className="rounded-full border border-[#070607]/40 bg-transparent px-8 py-3.5 text-sm sm:text-base font-bold text-[#070607] hover:bg-white/40 active:scale-98 transition"
                >
                  Launch Agent
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Four Ember (#fc5000) Stat Cards in a Row */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((s, idx) => (
            <div
              key={idx}
              className="rounded-[40px] bg-[#fc5000] p-9 text-white flex flex-col justify-between"
            >
              <span className="text-xs font-semibold uppercase tracking-wider text-white/90">
                {s.label}
              </span>
              <div className="mt-8 text-5xl sm:text-6xl font-black uppercase tracking-tight text-white leading-none">
                {s.value}
              </div>
            </div>
          ))}
        </section>

        {/* Supported Telegraph Intents Strip (Limestone card with dotted dividers) */}
        <section className="rounded-[40px] bg-[#f7f6f2] p-9 border border-[#070607]/10">
          <div className="text-center mb-6">
            <span className="text-xs font-bold uppercase tracking-widest text-[#070607]/60">
              SUPPORTED TELEGRAPH NETWORK INTENTS
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-8">
            {intents.map((intent, idx) => (
              <div key={idx} className="flex items-center gap-6 sm:gap-8">
                <span className="text-base sm:text-lg font-black tracking-wider text-[#070607]">
                  {intent}
                </span>
                {idx < intents.length - 1 && (
                  <span className="h-5 w-[1.5px] border-r-[1.5px] border-dotted border-[#070607]/30 hidden sm:inline-block" />
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Core Pillar 1: The Freshness Engine */}
        <section id="engine" className="rounded-[40px] bg-[#f7f6f2] p-10 sm:p-14 border border-[#070607]/10">
          <div className="max-w-2xl mb-12">
            <div className="inline-flex rounded-[800px] bg-[#f5f28e] px-3.5 py-1 text-xs font-bold text-[#070607] mb-4">
              THE CORE ALGORITHM
            </div>
            <h2 className="text-4xl sm:text-6xl font-black uppercase tracking-tight text-[#070607]">
              THE FRESHNESS ENGINE
            </h2>
            <p className="mt-4 text-base sm:text-lg font-medium text-[#070607]/70 leading-relaxed">
              Every answer an agent buys begins decaying the moment it arrives. Half-Life evaluates empirical volatility to stop redundant heartbeat burns.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step) => (
              <div
                key={step.num}
                className="rounded-[32px] bg-white p-7 border border-[#070607]/10 flex flex-col justify-between"
              >
                <div>
                  <span className="text-xs font-mono font-black text-[#fc5000]">
                    {step.num} / {step.title}
                  </span>
                  <h3 className="mt-4 text-xl font-black uppercase text-[#070607]">
                    {step.subtitle}
                  </h3>
                  <p className="mt-3 text-sm text-[#070607]/70 font-medium leading-relaxed">
                    {step.desc}
                  </p>
                </div>
                <div className="mt-8 pt-4 border-t border-[#070607]/10 text-[11px] font-mono text-[#070607]/50 uppercase">
                  Automated Decision Guard
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Core Pillar 2: Mission 09 Personal Agent Economy (Dark Section with Inset Halftone) */}
        <section id="missions" className="rounded-[40px] bg-[#070607] p-10 sm:p-14 text-white">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-7 flex flex-col gap-4">
              <div className="inline-flex self-start rounded-[800px] bg-[#fc5000] px-3.5 py-1 text-xs font-bold text-[#070607]">
                MISSION 09: APPS &amp; AGENTS TRACK
              </div>
              <h2 className="text-4xl sm:text-6xl font-black uppercase tracking-tight text-white leading-tight">
                GIVE EVERY AGENT A WALLET &amp; A MARKET
              </h2>
              <p className="text-base sm:text-lg text-white/80 font-medium leading-relaxed max-w-xl">
                Personal agents run 24/7 on stale context with no wallet and no market. Half-Life connects OpenClaw, Hermes, and Kimi Claw instances to buy fresh verified answers and settle on-chain with cryptographic receipts.
              </p>

              <div className="mt-6 flex flex-wrap gap-4">
                <Link
                  href="/atlas"
                  className="rounded-full bg-[#fc5000] px-7 py-3.5 text-base font-bold text-white hover:opacity-90 transition shadow-sm"
                >
                  Explore Freshness Atlas &rarr;
                </Link>
                <Link
                  href="/login"
                  className="rounded-full border border-white/30 px-7 py-3.5 text-base font-bold text-white hover:bg-white/10 transition"
                >
                  Configure Agent Caps
                </Link>
              </div>
            </div>

            {/* Inset Standout Halftone Card with Live Settlement Proof */}
            <div className="lg:col-span-5">
              <div className="rounded-[32px] bg-[#524ae9] p-8 text-white relative overflow-hidden border border-white/20">
                <div className="absolute inset-0 caldera-halftone opacity-40 pointer-events-none" />
                <div className="relative z-10 flex flex-col gap-3 font-mono text-xs">
                  <div className="text-[#f5f28e] font-bold tracking-wider">
                    ON-CHAIN PROOF OF SPEND
                  </div>
                  <div className="text-3xl font-black font-sans leading-none text-white my-2">
                    0.050 USD / ask
                  </div>
                  <div className="p-3 bg-black/40 rounded-xl space-y-1.5 text-[11px] text-white/90">
                    <div>Network: Ethereum Sepolia (11155111)</div>
                    <div className="truncate">Telegraph: 0x3624EB012B5E998BB57B6...</div>
                    <div className="text-[#9fe870] font-bold">Settlement: x402 Micropayments</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Live Intent Drift Showcase (Content Cards with Sulfur tags) */}
        <section id="showcase" className="flex flex-col gap-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="inline-flex rounded-[800px] bg-[#f5f28e] px-3.5 py-1 text-xs font-bold text-[#070607] mb-3">
                EMPIRICAL VOLATILITY BENCHMARKS
              </div>
              <h2 className="text-4xl sm:text-6xl font-black uppercase tracking-tight text-[#070607]">
                INTENT DRIFT CURVES
              </h2>
            </div>
            <Link
              href="/atlas"
              className="text-sm font-bold text-[#070607] hover:text-[#fc5000] underline underline-offset-4"
            >
              Open Live Freshness Atlas &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {showcaseCards.map((c) => (
              <div
                key={c.intent}
                className="rounded-[40px] bg-[#f7f6f2] p-8 border border-[#070607]/10 flex flex-col justify-between hover:border-[#fc5000]/50 transition group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-6">
                    <span className="rounded-[800px] bg-[#f5f28e] px-3 py-1 text-xs font-bold text-[#070607]">
                      {c.category}
                    </span>
                    <span className="text-xs font-mono font-bold text-[#fc5000]">
                      {c.decay}
                    </span>
                  </div>

                  <h3 className="text-2xl sm:text-3xl font-black uppercase text-[#070607] group-hover:text-[#fc5000] transition">
                    {c.intent}
                  </h3>
                  <p className="mt-3 text-sm font-medium text-[#070607]/70 leading-relaxed">
                    {c.headline}
                  </p>
                </div>

                <div className="mt-8 pt-4 border-t border-[#070607]/10 flex justify-between items-center text-xs font-mono">
                  <span className="text-[#070607]/60">Evaluator Target:</span>
                  <span className="font-bold text-[#070607]">{c.target}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Developer Integration Section (CLI & SDK) */}
        <section id="sdk" className="rounded-[40px] bg-[#f7f6f2] p-10 sm:p-14 border border-[#070607]/10">
          <div className="max-w-xl mb-8">
            <span className="inline-flex rounded-[800px] bg-[#f5f28e] px-3.5 py-1 text-xs font-bold text-[#070607] mb-3">
              DEVELOPER SDK &bull; CLAWHUB INTEGRATION
            </span>
            <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-[#070607]">
              WIRE INTO YOUR AGENT LOOP
            </h2>
            <p className="mt-2 text-sm sm:text-base font-medium text-[#070607]/70">
              Integrate the Half-Life Governor into any autonomous agent in 3 lines of code.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-12 rounded-[32px] bg-[#070607] p-6 sm:p-8 text-white font-mono text-xs w-full overflow-x-auto">
              <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
                <span className="text-[#f5f28e]">AGENT HEARTBEAT INTEGRATION (@half-life/sdk)</span>
                <span className="text-white/40">TypeScript / ESM</span>
              </div>
              <pre className="text-white/80 leading-relaxed overflow-x-auto">
{`// 1. Install Half-Life Governor SDK
import { HalfLifeGovernor } from "@half-life/sdk";

// 2. Initialize with agent budget & permitted intents
const governor = new HalfLifeGovernor({
  apiKey: process.env.HALF_LIFE_API_KEY,
  maxDailyCapUSD: 1.00,
  maxPerAskUSD: 0.05
});

// 3. Evaluate freshness before buying from Telegraph
const decision = await governor.evaluate({
  intent: "FX_NOW",
  lastAnswerTimestamp: agentState.lastAnswerTime,
  stakeUSD: 100
});

if (decision.shouldBuy) {
  const freshAnswer = await telegraph.buy("FX_NOW");
  await governor.recordPurchase(freshAnswer.receipt);
}`}
              </pre>
            </div>
          </div>
        </section>

        {/* Application Interactive Demo & End-to-End Walkthrough Section */}
        <section id="demo" className="rounded-[40px] bg-[#f7f6f2] p-8 sm:p-14 border border-[#070607]/10 flex flex-col gap-10">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-[#070607]/10 pb-8">
            <div className="max-w-2xl">
              <span className="inline-flex rounded-[800px] bg-[#fc5000] px-3.5 py-1 text-xs font-bold text-white mb-3">
                APPLICATION DEMO &bull; HOW IT ALL WORKS
              </span>
              <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-[#070607]">
                SEE WHAT HALF-LIFE DOES BEFORE YOU START
              </h2>
              <p className="mt-3 text-sm sm:text-base font-medium text-[#070607]/70 leading-relaxed">
                Autonomous AI agents waste thousands of dollars buying identical data over and over. Half-Life measures information decay so agents only pay when new information genuinely matters.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="rounded-full bg-[#070607] px-6 py-3 text-sm font-semibold text-white hover:bg-[#fc5000] transition shadow-sm"
              >
                Open Testing Studio &rarr;
              </Link>
            </div>
          </div>

          {/* 4 Architectural Pillars: What the whole application does */}
          <div>
            <div className="mb-4">
              <span className="text-xs font-mono uppercase tracking-wider text-[#070607]/60 font-bold">
                The 4 Stages of Half-Life
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="rounded-[28px] bg-white p-6 border border-[#070607]/10 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-mono font-bold text-[#fc5000] block mb-2">STAGE 01</span>
                  <h3 className="text-lg font-bold uppercase text-[#070607]">Atlas Sampler</h3>
                  <p className="mt-2 text-xs font-medium text-[#070607]/70 leading-relaxed">
                    A 24/7 background worker deployed on Render queries Telegraph miners every 60s, continuously tracking independent miner disagreement (Noise Floor &eta;).
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-[#070607]/10 text-[11px] font-mono text-[#070607]/60">
                  Runs automatically in background
                </div>
              </div>

              <div className="rounded-[28px] bg-white p-6 border border-[#070607]/10 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-mono font-bold text-[#fc5000] block mb-2">STAGE 02</span>
                  <h3 className="text-lg font-bold uppercase text-[#070607]">Governor Engine</h3>
                  <p className="mt-2 text-xs font-medium text-[#070607]/70 leading-relaxed">
                    Evaluates Expected Loss (Stake &times; Drift). If drift is below the noise floor, it returns a verified REUSE for $0.00 in &lt;5ms instead of paying miner fees.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-[#070607]/10 text-[11px] font-mono text-[#070607]/60">
                  Saves 64%+ of agent budgets
                </div>
              </div>

              <div className="rounded-[28px] bg-white p-6 border border-[#070607]/10 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-mono font-bold text-[#fc5000] block mb-2">STAGE 03</span>
                  <h3 className="text-lg font-bold uppercase text-[#070607]">Testing Studio</h3>
                  <p className="mt-2 text-xs font-medium text-[#070607]/70 leading-relaxed">
                    Developers test live queries in a sandbox, generate custom cURL / TypeScript / Python code using Gemini AI, and inspect real-time Governor decisions.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-[#070607]/10 text-[11px] font-mono text-[#070607]/60">
                  5 pre-built templates included
                </div>
              </div>

              <div className="rounded-[28px] bg-white p-6 border border-[#070607]/10 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-mono font-bold text-[#fc5000] block mb-2">STAGE 04</span>
                  <h3 className="text-lg font-bold uppercase text-[#070607]">On-Chain Proof</h3>
                  <p className="mt-2 text-xs font-medium text-[#070607]/70 leading-relaxed">
                    Every miner purchase and cryptographic consensus receipt is verified on Ethereum Sepolia with immutable Merkle proofs and complete audit history.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-[#070607]/10 text-[11px] font-mono text-[#070607]/60">
                  Sepolia x402 settlement
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Live Simulation Console */}
          <div className="rounded-[32px] bg-[#070607] p-6 sm:p-10 text-white flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
              <div>
                <span className="text-xs font-mono uppercase tracking-wider text-[#f5f28e] font-semibold">
                  Interactive Simulator
                </span>
                <h3 className="text-2xl font-bold uppercase text-white mt-1">
                  Try the Governor Right Here
                </h3>
                <p className="text-xs text-white/60 mt-0.5">
                  Click a scenario below to see how the Governor calculates drift and decides whether to BUY or REUSE:
                </p>
              </div>

              {/* Scenario Toggle Tabs */}
              <div className="flex flex-wrap items-center gap-2">
                {(Object.keys(DEMO_SCENARIOS) as (keyof typeof DEMO_SCENARIOS)[]).map((key) => {
                  const s = DEMO_SCENARIOS[key];
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setDemoScenario(key)}
                      className={`rounded-full px-4 py-2 text-xs font-mono font-bold transition ${
                        demoScenario === key
                          ? "bg-[#fc5000] text-white shadow-sm"
                          : "bg-white/10 text-white/70 hover:bg-white/20 hover:text-white"
                      }`}
                    >
                      {s.title}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Active Simulation Display */}
            {(() => {
              const current = DEMO_SCENARIOS[demoScenario];
              const isReuse = current.action === "reuse";
              return (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start font-mono text-xs">
                  {/* Left Column: Simulated Request Context */}
                  <div className="lg:col-span-5 flex flex-col gap-4 rounded-2xl bg-white/5 border border-white/10 p-5">
                    <div>
                      <span className="text-[10px] uppercase text-white/50 block mb-1">Simulated User Query:</span>
                      <p className="font-sans text-sm font-semibold text-white leading-relaxed">
                        &quot;{current.query}&quot;
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/10">
                      <div>
                        <span className="text-[10px] uppercase text-white/50 block">Intent:</span>
                        <span className="font-bold text-[#f5f28e]">{current.intent}</span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase text-white/50 block">Stake Exposure:</span>
                        <span className="font-bold text-white">${current.stake.toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-white/10">
                      <span className="text-[10px] uppercase text-white/50 block mb-1">Key Insight:</span>
                      <p className="font-sans text-xs text-white/80 leading-relaxed">
                        {current.explanation}
                      </p>
                    </div>
                  </div>

                  {/* Right Column: Live Governor Decision Output */}
                  <div className="lg:col-span-7 flex flex-col gap-4 rounded-2xl bg-[#121214] border border-white/10 p-5">
                    {/* Verdict Banner */}
                    <div className={`rounded-xl p-4 flex items-center justify-between border ${
                      isReuse ? "bg-blue-950/60 border-blue-800 text-blue-200" : "bg-emerald-950/60 border-emerald-800 text-emerald-200"
                    }`}>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white ${
                            isReuse ? "bg-blue-600" : "bg-emerald-600"
                          }`}>
                            GOVERNOR: {current.action}
                          </span>
                          <span className="text-xs font-semibold text-white">
                            {isReuse ? "Zero-Cost Cache Reuse" : "Fresh Miner Purchase"}
                          </span>
                        </div>
                        <p className="mt-2 text-xs text-white/80 font-sans leading-relaxed">
                          {current.reason}
                        </p>
                      </div>

                      <div className="text-right shrink-0 ml-4">
                        <div className="text-[10px] uppercase text-white/50">Fee Paid</div>
                        <div className="text-base font-bold text-white">{current.cost}</div>
                      </div>
                    </div>

                    {/* Mathematical Metrics */}
                    <div className="grid grid-cols-3 gap-2 text-[11px]">
                      <div className="rounded bg-white/5 p-2.5 border border-white/5">
                        <span className="text-white/50 block text-[9px] uppercase">Drift d(&Delta;t)</span>
                        <span className="font-semibold text-white">{current.drift}</span>
                      </div>
                      <div className="rounded bg-white/5 p-2.5 border border-white/5">
                        <span className="text-white/50 block text-[9px] uppercase">Noise Floor &eta;</span>
                        <span className="font-semibold text-white">{current.noiseFloor}</span>
                      </div>
                      <div className="rounded bg-white/5 p-2.5 border border-white/5">
                        <span className="text-white/50 block text-[9px] uppercase">Execution Latency</span>
                        <span className={`font-semibold ${isReuse ? "text-blue-400" : "text-emerald-400"}`}>
                          {current.latency}
                        </span>
                      </div>
                    </div>

                    {/* Result Payload Preview */}
                    <div className="rounded bg-black/50 p-3 border border-white/5">
                      <div className="flex items-center justify-between text-[10px] text-white/50 mb-1">
                        <span>ANSWER PAYLOAD:</span>
                        <span className="text-green-400 font-bold">{isReuse ? "$0.00 Saved" : "Sepolia Verified"}</span>
                      </div>
                      <pre className="text-green-400 overflow-x-auto text-[11px]">
                        {JSON.stringify(current.payload, null, 2)}
                      </pre>
                    </div>

                    {/* Proof Hash */}
                    <div className="text-[10px] text-white/40 truncate">
                      Sepolia Proof: <span className="text-white/70">{current.proof}</span>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Bottom Callout: What Users Do in the Full Application */}
          <div className="rounded-[32px] bg-white p-8 border border-[#070607]/10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-xl sm:text-2xl font-bold uppercase text-[#070607]">
                Ready to wire intelligent freshness into your agents?
              </h3>
              <p className="mt-1 text-sm text-[#070607]/70">
                Log in to create scoped agent keys, run custom scenarios in the Testing Studio, and monitor your cumulative savings.
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <Link
                href="/login"
                className="rounded-full bg-[#fc5000] px-7 py-3 text-sm font-bold text-white hover:opacity-90 transition shadow-sm"
              >
                Launch Dashboard
              </Link>
              <Link
                href="/atlas"
                className="rounded-full border border-[#070607]/20 px-6 py-3 text-sm font-semibold text-[#070607] hover:border-[#070607] transition"
              >
                Explore Atlas
              </Link>
            </div>
          </div>
        </section>

        {/* Dark Input Section: Stay Ahead with Pill Input */}
        <section className="rounded-[40px] bg-[#070607] p-10 sm:p-14 text-white">
          <div className="max-w-2xl mx-auto text-center flex flex-col items-center">
            <span className="inline-flex rounded-[800px] bg-[#fc5000] px-3.5 py-1 text-xs font-bold text-[#070607] mb-4">
              TELEGRAPH SEASON II
            </span>
            <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-white">
              STAY TUNED TO AUTONOMOUS INTELLIGENCE
            </h2>
            <p className="mt-4 text-sm sm:text-base font-medium text-white/70 max-w-lg">
              Get empirical drift curve releases, miner leaderboard reports, and SDK updates.
            </p>

            {subscribed ? (
              <div className="mt-8 rounded-[100px] bg-[#f5f28e] text-[#070607] px-8 py-4 font-bold text-sm">
                ✓ You are subscribed to Half-Life updates!
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="mt-8 w-full max-w-md flex flex-col sm:flex-row gap-3">
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="Enter your email address"
                  required
                  className="flex-1 rounded-[100px] border-[1.5px] border-white/60 bg-transparent px-6 py-3.5 text-sm font-medium text-white placeholder-white/50 outline-none focus:border-[#fc5000] transition"
                />
                <button
                  type="submit"
                  className="rounded-full bg-[#fc5000] px-8 py-3.5 text-sm font-bold text-white hover:opacity-90 transition shrink-0"
                >
                  Subscribe
                </button>
              </form>
            )}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#070607]/10 bg-[#e2e2df] py-16 px-4 sm:px-6 max-w-[1280px] mx-auto w-full">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          {/* Logo & Bio */}
          <div className="col-span-2">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="h-6 w-6 rounded-md bg-[#fc5000] flex items-center justify-center text-white">
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              </div>
              <span className="text-xl font-black tracking-tight text-[#070607] uppercase">
                HALF-LIFE
              </span>
            </Link>
            <p className="mt-4 text-xs font-medium text-[#070607]/70 max-w-sm leading-relaxed">
              Half-Life is an autonomous freshness decision engine and decay atlas built for the Telegraph Protocol during Hackathon Season II.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#070607] mb-3">
              Navigation
            </h4>
            <ul className="space-y-2 text-xs font-medium text-[#070607]/70">
              <li><Link href="/atlas" className="hover:text-[#fc5000]">Freshness Atlas</Link></li>
              <li><Link href="/app/benchmarks" className="hover:text-[#fc5000]">Benchmarks</Link></li>
              <li><Link href="/login" className="hover:text-[#fc5000]">Agent Dashboard</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#070607] mb-3">
              Protocol
            </h4>
            <ul className="space-y-2 text-xs font-medium text-[#070607]/70">
              <li><a href="https://anjoman.ai" target="_blank" rel="noreferrer" className="hover:text-[#fc5000]">Telegraph Protocol</a></li>
              <li><Link href="/app" className="hover:text-[#fc5000]">API Explorer</Link></li>
              <li><Link href="/login" className="hover:text-[#fc5000]">ClawHub Skill</Link></li>
              <li><Link href="/app/admin/audit" className="hover:text-[#fc5000]">Merkle Audit</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#070607] mb-3">
              Legal
            </h4>
            <ul className="space-y-2 text-xs font-medium text-[#070607]/70">
              <li><Link href="/terms" className="hover:text-[#fc5000]">Terms of Service</Link></li>
              <li><Link href="/privacy" className="hover:text-[#fc5000]">Privacy Policy</Link></li>
              <li><span className="text-[#070607]/40">License: Apache-2.0</span></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-[#070607]/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-medium text-[#070607]/60">
          <div>
            &copy; {new Date().getFullYear()} Half-Life &bull; Telegraph Hackathon Season II (Track 03).
          </div>
          <div>
            <span>Autonomous Intelligence Protection Engine</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
