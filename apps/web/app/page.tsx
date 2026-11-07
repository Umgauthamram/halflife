"use client";

import Link from "next/link";
import { useState } from "react";

export default function HalfLifeLandingPage() {
  const [emailInput, setEmailInput] = useState("");
  const [subscribed, setSubscribed] = useState(false);

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
          {/* Logo Lockup */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="h-6 w-7 rounded-sm bg-[#fc5000] flex items-center justify-center text-white font-black text-xs">
              λ
            </div>
            <span className="text-xl font-black tracking-tight text-[#070607] uppercase">
              HALF-LIFE
            </span>
          </Link>

          {/* Dotted Divider & Nav Links */}
          <div className="hidden md:flex items-center">
            <span className="h-5 w-[1.5px] border-r-[1.5px] border-dotted border-[#070607]/40 mr-6" />
            <div className="flex items-center gap-6 text-[15px] font-medium text-[#070607]">
              <Link href="/atlas" className="hover:text-[#fc5000] transition">
                Atlas
              </Link>
              <Link href="#engine" className="hover:text-[#fc5000] transition">
                Governor
              </Link>
              <Link href="/app/leaderboard" className="hover:text-[#fc5000] transition">
                Leaderboard
              </Link>
              <Link href="#missions" className="hover:text-[#fc5000] transition">
                Mission 09
              </Link>
              <Link href="#sdk" className="hover:text-[#fc5000] transition">
                Docs
              </Link>
            </div>
          </div>

          {/* Social Glyphs & CTA Button */}
          <div className="flex items-center">
            {/* Dotted Divider */}
            <span className="hidden lg:inline-block h-5 w-[1.5px] border-r-[1.5px] border-dotted border-[#070607]/40 mr-5" />

            {/* Social Icons */}
            <div className="hidden lg:flex items-center gap-3.5 mr-5">
              <a
                href="https://x.com"
                target="_blank"
                rel="noreferrer"
                className="text-[#070607] hover:text-[#fc5000] transition"
                aria-label="X"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
              <a
                href="https://discord.com"
                target="_blank"
                rel="noreferrer"
                className="text-[#070607] hover:text-[#fc5000] transition"
                aria-label="Discord"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028z" />
                </svg>
              </a>
              <a
                href="https://t.me"
                target="_blank"
                rel="noreferrer"
                className="text-[#070607] hover:text-[#fc5000] transition"
                aria-label="Telegram"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 0 0-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
                </svg>
              </a>
            </div>

            {/* Dotted Divider before button */}
            <span className="hidden lg:inline-block h-5 w-[1.5px] border-r-[1.5px] border-dotted border-[#070607]/40 mr-5" />

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
                  href="/app/leaderboard"
                  className="rounded-full bg-[#fc5000] px-7 py-3.5 text-base font-bold text-white hover:opacity-90 transition shadow-sm"
                >
                  View Spend Leaderboard &rarr;
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
                    <div className="truncate">Tx: 0x5b7bfd33ec11444a07117ac...</div>
                    <div className="truncate">Operator: 0xB980b2dBA0004e12f...</div>
                    <div className="text-[#9fe870] font-bold">Status: Confirmed on Sepolia</div>
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
            <Link href="/" className="flex items-center gap-2">
              <div className="h-6 w-7 rounded-sm bg-[#fc5000] flex items-center justify-center text-white font-black text-xs">
                λ
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
              <li><Link href="/app/leaderboard" className="hover:text-[#fc5000]">Spend Leaderboard</Link></li>
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
          <div className="flex gap-6">
            <a href="https://x.com" target="_blank" rel="noreferrer" className="hover:text-[#070607]">X / Twitter</a>
            <a href="https://discord.com" target="_blank" rel="noreferrer" className="hover:text-[#070607]">Discord</a>
            <a href="https://t.me" target="_blank" rel="noreferrer" className="hover:text-[#070607]">Telegram</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
