"use client";

import Link from "next/link";
import { useState } from "react";

type Framework = "nitro" | "op" | "cdk" | "zksync";
type DALayer = "celestia" | "eigenda" | "blobs";

export default function CalderaLandingPage() {
  const [selectedFramework, setSelectedFramework] = useState<Framework>("nitro");
  const [selectedDA, setSelectedDA] = useState<DALayer>("celestia");
  const [emailInput, setEmailInput] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const stats = [
    { value: "50+", label: "LIVE PRODUCTION ROLLUPS" },
    { value: "100M+", label: "TOTAL TRANSACTIONS" },
    { value: "$500M+", label: "TOTAL VALUE SECURED" },
    { value: "1.8M+", label: "UNIQUE WALLET ADDRESSES" },
  ];

  const partners = [
    "ARBITRUM",
    "OPTIMISM",
    "POLYGON",
    "CELESTIA",
    "EIGENLAYER",
    "HYPERLANE",
    "ZKSYNC",
    "INJECTIVE",
  ];

  const rollups = [
    {
      name: "ApeChain",
      tag: "GAMING & CULTURE",
      headline: "Powered by Arbitrum Nitro & ApeCoin for next-gen interactive entertainment",
      framework: "Arbitrum Nitro",
      date: "Q3 2024",
    },
    {
      name: "Manta Pacific",
      tag: "ZERO KNOWLEDGE",
      headline: "Scalable ZK applications with modular Celestia Data Availability",
      framework: "OP Stack + Celestia",
      date: "Q1 2024",
    },
    {
      name: "Kinto",
      tag: "FINTECH & RWA",
      headline: "First KYC-compliant Layer 2 designed for traditional financial institutions",
      framework: "Arbitrum Orbit",
      date: "Q2 2024",
    },
    {
      name: "Plume Network",
      tag: "REAL WORLD ASSETS",
      headline: "Modular L2 purpose-built for compliant RWA composability and institutional adoption",
      framework: "Arbitrum Nitro",
      date: "Q3 2024",
    },
    {
      name: "RARI Chain",
      tag: "CREATOR ECONOMY",
      headline: "NFT-first ecosystem with creator royalties enforced directly at the node level",
      framework: "Arbitrum Orbit",
      date: "Q1 2024",
    },
    {
      name: "inEVM",
      tag: "CROSS-VM ROLLUP",
      headline: "Injective's multi-VM rollup bridging Ethereum, Cosmos, and Solana liquidity",
      framework: "Custom Rollup",
      date: "Q2 2024",
    },
  ];

  const articles = [
    {
      tag: "ANNOUNCEMENT",
      title: "Introducing Caldera's Series A: Scaling the Modular Era",
      date: "July 24, 2024",
      readTime: "4 min read",
    },
    {
      tag: "RESEARCH",
      title: "BoLD on Caldera: Permissionless Validation for Arbitrum Nitro Chains",
      date: "August 12, 2024",
      readTime: "7 min read",
    },
    {
      tag: "ENGINEERING",
      title: "Sub-Second Bridging: How the Metalayer Routes Cross-Chain Intents",
      date: "September 05, 2024",
      readTime: "6 min read",
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
      {/* Floating Navigation Bar inside Limestone Pill Container */}
      <header className="sticky top-6 z-50 px-4 sm:px-6 max-w-[1280px] mx-auto w-full">
        <nav className="flex items-center justify-between rounded-[800px] bg-[#f7f6f2] px-6 py-3.5 border border-[#070607]/10">
          {/* Logo Lockup */}
          <Link href="/" className="flex items-center gap-2.5 group">
            {/* Mountain / Caldera Emblem */}
            <div className="h-6 w-6 rounded-md bg-[#fc5000] flex items-center justify-center text-white">
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                <polygon points="12 2 2 22 22 22" />
              </svg>
            </div>
            <span className="text-xl font-black tracking-tight text-[#070607] uppercase">
              CALDERA
            </span>
          </Link>

          {/* Center Navigation Links (DM Sans 500 at 16px) */}
          <div className="hidden md:flex items-center gap-7 text-[16px] font-medium text-[#070607]">
            <Link href="#engine" className="hover:text-[#fc5000] transition">
              Rollup Engine
            </Link>
            <Link href="#metalayer" className="hover:text-[#fc5000] transition">
              Metalayer
            </Link>
            <Link href="#ecosystem" className="hover:text-[#fc5000] transition">
              Ecosystem
            </Link>
            <Link href="#configurator" className="hover:text-[#fc5000] transition">
              Modular Stack
            </Link>
            <Link href="#blog" className="hover:text-[#fc5000] transition">
              Blog
            </Link>
          </div>

          {/* Right Action Cluster */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Social Icons with Dotted Divider */}
            <div className="hidden lg:flex items-center gap-3 pr-3 border-r-[1.5px] border-dotted border-[#070607]">
              {/* X / Twitter */}
              <a
                href="https://x.com/Calderaxyz"
                target="_blank"
                rel="noreferrer"
                className="text-[#070607] hover:text-[#fc5000] transition"
                aria-label="X (Twitter)"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>

              {/* Discord */}
              <a
                href="https://discord.gg/caldera"
                target="_blank"
                rel="noreferrer"
                className="text-[#070607] hover:text-[#fc5000] transition"
                aria-label="Discord"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028z" />
                </svg>
              </a>
            </div>

            {/* Primary CTA Pill Button (Ember #fc5000 with Obsidian text) */}
            <Link
              href="/login"
              className="rounded-[800px] bg-[#fc5000] px-6 py-2.5 text-[15px] sm:text-[16px] font-medium text-[#070607] transition hover:opacity-90 active:scale-98"
            >
              Launch a Rollup
            </Link>
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex flex-col gap-20 pt-10 pb-20 px-4 sm:px-6 max-w-[1280px] mx-auto w-full">
        {/* Hero Section */}
        <section className="flex flex-col gap-10 pt-6">
          <div className="flex flex-col gap-6 max-w-5xl">


            {/* Signature Architectural Display Headline (189px scale, tight line-height 0.94) */}
            <h1 className="text-6xl sm:text-7xl md:text-8xl lg:text-[140px] xl:text-[170px] font-black uppercase tracking-[0.02em] leading-[0.9] text-[#070607]">
              THE INTERNET OF ROLLUPS
            </h1>

            {/* Subheading (DM Sans 500) */}
            <p className="text-lg sm:text-2xl font-medium text-[#070607]/80 max-w-3xl leading-relaxed">
              Caldera makes it effortless to launch and scale dedicated, high-performance Layer 2 and Layer 3 rollups with the modular stack of your choice.
            </p>

            {/* Hero Button Cluster */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              {/* Primary CTA Button */}
              <Link
                href="/login"
                className="rounded-[800px] bg-[#fc5000] px-8 py-4 text-base font-medium text-[#070607] transition hover:opacity-90 shadow-none"
              >
                Launch in Minutes
              </Link>

              {/* Secondary Pill Button */}
              <Link
                href="#metalayer"
                className="rounded-[40px] border-[1.5px] border-[#070607] bg-transparent px-8 py-4 text-base font-medium text-[#070607] transition hover:bg-[#f7f6f2]"
              >
                Explore the Metalayer &rarr;
              </Link>
            </div>
          </div>

          {/* Hero Visual: Standout Halftone Plasma Card & Interactive Config Console */}
          <div className="rounded-[40px] overflow-hidden border border-[#070607]/10 bg-[#524ae9] relative p-8 sm:p-12 text-white">
            {/* Halftone Dot Overlay */}
            <div className="absolute inset-0 caldera-halftone opacity-40 pointer-events-none" />

            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              {/* Left Console Overview */}
              <div className="lg:col-span-7 flex flex-col gap-4">
                <span className="inline-flex self-start rounded-[800px] bg-[#f5f28e] px-3 py-1 text-xs font-medium text-[#070607]">
                  PRODUCTION ENGINE
                </span>
                <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-white leading-tight">
                  ENTERPRISE MODULAR STACK
                </h2>
                <p className="text-base sm:text-lg text-white/90 font-medium max-w-xl">
                  Provision fully customizable execution environments, high-throughput DA, and dedicated RPC infrastructure in seconds.
                </p>

                {/* Framework Selector Pills */}
                <div className="flex flex-wrap gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedFramework("nitro")}
                    className={`rounded-[800px] px-4 py-2 text-xs font-medium transition ${
                      selectedFramework === "nitro"
                        ? "bg-[#fc5000] text-[#070607]"
                        : "bg-white/20 text-white hover:bg-white/30"
                    }`}
                  >
                    Arbitrum Nitro
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedFramework("op")}
                    className={`rounded-[800px] px-4 py-2 text-xs font-medium transition ${
                      selectedFramework === "op"
                        ? "bg-[#fc5000] text-[#070607]"
                        : "bg-white/20 text-white hover:bg-white/30"
                    }`}
                  >
                    OP Stack
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedFramework("cdk")}
                    className={`rounded-[800px] px-4 py-2 text-xs font-medium transition ${
                      selectedFramework === "cdk"
                        ? "bg-[#fc5000] text-[#070607]"
                        : "bg-white/20 text-white hover:bg-white/30"
                    }`}
                  >
                    Polygon CDK
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedFramework("zksync")}
                    className={`rounded-[800px] px-4 py-2 text-xs font-medium transition ${
                      selectedFramework === "zksync"
                        ? "bg-[#fc5000] text-[#070607]"
                        : "bg-white/20 text-white hover:bg-white/30"
                    }`}
                  >
                    ZK Stack
                  </button>
                </div>
              </div>

              {/* Right Live Rollup Telemetry Card */}
              <div className="lg:col-span-5">
                <div className="rounded-[32px] bg-[#f7f6f2] p-6 text-[#070607]">
                  <div className="flex items-center justify-between pb-3 border-b border-[#070607]/10">
                    <span className="text-xs font-mono uppercase tracking-wider text-[#070607]/60">
                      ROLLUP STATUS: ONLINE
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-[#fc5000]">
                      <span className="h-2 w-2 rounded-full bg-[#fc5000] animate-pulse" />
                      Active Block 12,482,019
                    </span>
                  </div>

                  <div className="mt-4 space-y-3 font-mono text-xs">
                    <div className="flex justify-between py-1 border-b border-[#070607]/5">
                      <span className="text-[#070607]/60">Framework</span>
                      <span className="font-bold text-[#070607] uppercase">
                        {selectedFramework === "nitro"
                          ? "Arbitrum Nitro"
                          : selectedFramework === "op"
                          ? "Optimism OP Stack"
                          : selectedFramework === "cdk"
                          ? "Polygon CDK"
                          : "ZKsync ZK Stack"}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-[#070607]/5">
                      <span className="text-[#070607]/60">Settlement Layer</span>
                      <span className="font-bold text-[#070607]">Ethereum L1</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-[#070607]/5">
                      <span className="text-[#070607]/60">Data Availability</span>
                      <span className="font-bold text-[#070607]">Celestia Mocha</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-[#070607]/5">
                      <span className="text-[#070607]/60">Block Latency</span>
                      <span className="font-bold text-[#fc5000]">250 ms</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-[#070607]/60">Throughput Target</span>
                      <span className="font-bold text-[#070607]">2,500+ TPS</span>
                    </div>
                  </div>

                  <Link
                    href="/login"
                    className="mt-6 block w-full rounded-[800px] bg-[#070607] py-3 text-center text-xs font-medium text-white hover:bg-[#fc5000] hover:text-[#070607] transition"
                  >
                    Deploy This Configuration &rarr;
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Four Ember (#fc5000) Stat Feature Cards in a Row */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((s, idx) => (
            <div
              key={idx}
              className="rounded-[40px] bg-[#fc5000] p-10 text-white flex flex-col justify-between"
            >
              <span className="text-xs font-medium uppercase tracking-wider text-white/90">
                {s.label}
              </span>
              <div className="mt-8 text-6xl sm:text-7xl font-black uppercase tracking-tight text-white leading-none">
                {s.value}
              </div>
            </div>
          ))}
        </section>

        {/* Partner Logo Strip (Limestone #f7f6f2 card with dotted dividers) */}
        <section className="rounded-[40px] bg-[#f7f6f2] p-10 border border-[#070607]/10">
          <div className="text-center mb-8">
            <span className="text-xs font-bold uppercase tracking-widest text-[#070607]/60">
              TRUSTED BY INDUSTRY-LEADING PROTOCOLS &amp; FRAMEWORKS
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10">
            {partners.map((partner, idx) => (
              <div key={idx} className="flex items-center gap-6 sm:gap-10">
                <span className="text-lg sm:text-xl font-black tracking-wider text-[#070607]">
                  {partner}
                </span>
                {idx < partners.length - 1 && (
                  <span className="h-6 w-[1.5px] border-r-[1.5px] border-dotted border-[#070607]/40 hidden sm:inline-block" />
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Product Pillar 1: The Rollup Engine */}
        <section id="engine" className="rounded-[40px] bg-[#f7f6f2] p-10 sm:p-14 border border-[#070607]/10">
          <div className="max-w-2xl mb-12">
            <div className="inline-flex rounded-[800px] bg-[#f5f28e] px-3.5 py-1 text-xs font-medium text-[#070607] mb-4">
              CORE INFRASTRUCTURE
            </div>
            <h2 className="text-4xl sm:text-6xl font-black uppercase tracking-tight text-[#070607]">
              THE ROLLUP ENGINE
            </h2>
            <p className="mt-4 text-base sm:text-lg font-medium text-[#070607]/70 leading-relaxed">
              A comprehensive operating system to deploy, customize, and manage dedicated app-chains with enterprise uptime and automated infra maintenance.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="rounded-[32px] bg-white p-8 border border-[#070607]/10 flex flex-col justify-between">
              <div>
                <div className="h-10 w-10 rounded-full bg-[#f5f28e] flex items-center justify-center text-lg font-bold">
                  ⚡
                </div>
                <h3 className="mt-6 text-xl font-black uppercase text-[#070607]">
                  Instant Provisioning
                </h3>
                <p className="mt-2 text-sm text-[#070607]/70 font-medium leading-relaxed">
                  Generate RPC endpoints, block explorers, bridge user interfaces, indexers, and testnet faucets with a single click.
                </p>
              </div>
              <div className="mt-8 pt-4 border-t border-[#070607]/10 text-xs font-mono font-bold text-[#fc5000]">
                ZERO DEVOPS REQUIRED
              </div>
            </div>

            <div className="rounded-[32px] bg-white p-8 border border-[#070607]/10 flex flex-col justify-between">
              <div>
                <div className="h-10 w-10 rounded-full bg-[#f5f28e] flex items-center justify-center text-lg font-bold">
                  🧩
                </div>
                <h3 className="mt-6 text-xl font-black uppercase text-[#070607]">
                  Modular Freedom
                </h3>
                <p className="mt-2 text-sm text-[#070607]/70 font-medium leading-relaxed">
                  Choose Arbitrum Nitro, OP Stack, or Polygon CDK with Celestia or EigenDA. You maintain total sovereign ownership of your chain contracts.
                </p>
              </div>
              <div className="mt-8 pt-4 border-t border-[#070607]/10 text-xs font-mono font-bold text-[#fc5000]">
                TOTAL CONTRACT SOVEREIGNTY
              </div>
            </div>

            <div className="rounded-[32px] bg-white p-8 border border-[#070607]/10 flex flex-col justify-between">
              <div>
                <div className="h-10 w-10 rounded-full bg-[#f5f28e] flex items-center justify-center text-lg font-bold">
                  🛡️
                </div>
                <h3 className="mt-6 text-xl font-black uppercase text-[#070607]">
                  Production Battle-Tested
                </h3>
                <p className="mt-2 text-sm text-[#070607]/70 font-medium leading-relaxed">
                  Equipped with 24/7 dedicated validator monitoring, automatic client updates, DDoS mitigation, and enterprise SLAs.
                </p>
              </div>
              <div className="mt-8 pt-4 border-t border-[#070607]/10 text-xs font-mono font-bold text-[#fc5000]">
                99.99% UPTIME RECORD
              </div>
            </div>
          </div>
        </section>

        {/* Product Pillar 2: The Metalayer */}
        <section id="metalayer" className="rounded-[40px] bg-[#070607] p-10 sm:p-14 text-white">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-7 flex flex-col gap-4">
              <div className="inline-flex self-start rounded-[800px] bg-[#fc5000] px-3.5 py-1 text-xs font-medium text-[#070607]">
                THE UNIFIED NETWORK
              </div>
              <h2 className="text-4xl sm:text-6xl font-black uppercase tracking-tight text-white leading-tight">
                THE METALAYER IS HERE
              </h2>
              <p className="text-base sm:text-lg text-white/80 font-medium leading-relaxed max-w-xl">
                Eliminate liquidity silos. The Metalayer stitches every Caldera chain into a single, unified web of rollups with sub-second bridging, shared liquidity, and seamless intent-based execution.
              </p>

              <div className="mt-6 flex flex-wrap gap-4">
                <Link
                  href="/login"
                  className="rounded-[800px] bg-[#fc5000] px-7 py-3.5 text-base font-medium text-[#070607] hover:opacity-90 transition"
                >
                  Join the Metalayer
                </Link>
                <Link
                  href="#ecosystem"
                  className="rounded-[40px] border border-white/30 px-7 py-3.5 text-base font-medium text-white hover:bg-white/10 transition"
                >
                  Explore Supported Chains
                </Link>
              </div>
            </div>

            {/* Inset Standout Halftone Visual */}
            <div className="lg:col-span-5">
              <div className="rounded-[32px] bg-[#524ae9] p-8 text-white relative overflow-hidden border border-white/20">
                <div className="absolute inset-0 caldera-halftone opacity-50" />
                <div className="relative z-10 flex flex-col gap-4">
                  <div className="text-xs font-mono uppercase tracking-wider text-[#f5f28e]">
                    INTEROP SPEED
                  </div>
                  <div className="text-5xl font-black leading-none text-white">
                    &lt; 1.0 SEC
                  </div>
                  <p className="text-xs text-white/90 font-medium leading-relaxed">
                    Zero-slippage cross-chain swaps and messages powered by native intent relays across all Caldera chains.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Ecosystem Showcase Grid (Content Cards) */}
        <section id="ecosystem" className="flex flex-col gap-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="inline-flex rounded-[800px] bg-[#f5f28e] px-3.5 py-1 text-xs font-medium text-[#070607] mb-3">
                ECOSYSTEM SHOWCASE
              </div>
              <h2 className="text-4xl sm:text-6xl font-black uppercase tracking-tight text-[#070607]">
                BUILT ON CALDERA
              </h2>
            </div>
            <p className="text-sm font-medium text-[#070607]/70 max-w-md">
              Over 50 leading Web3 applications, gaming networks, and financial protocols power their sovereign chains with Caldera.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rollups.map((r, idx) => (
              <div
                key={idx}
                className="rounded-[40px] bg-[#f7f6f2] p-8 sm:p-10 border border-[#070607]/10 flex flex-col justify-between hover:border-[#fc5000]/50 transition group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-6">
                    <span className="rounded-[800px] bg-[#f5f28e] px-3 py-1 text-xs font-medium text-[#070607]">
                      {r.tag}
                    </span>
                    <span className="text-xs font-mono text-[#070607]/60">
                      {r.date}
                    </span>
                  </div>

                  <h3 className="text-2xl sm:text-3xl font-black uppercase text-[#070607] group-hover:text-[#fc5000] transition">
                    {r.name}
                  </h3>
                  <p className="mt-3 text-sm font-medium text-[#070607]/70 leading-relaxed">
                    {r.headline}
                  </p>
                </div>

                <div className="mt-8 pt-4 border-t border-[#070607]/10 flex justify-between items-center text-xs font-mono">
                  <span className="text-[#070607]/60">Stack:</span>
                  <span className="font-bold text-[#070607]">{r.framework}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Interactive Modular Stack Configurator */}
        <section id="configurator" className="rounded-[40px] bg-[#f7f6f2] p-10 sm:p-14 border border-[#070607]/10">
          <div className="max-w-xl mb-10">
            <span className="inline-flex rounded-[800px] bg-[#f5f28e] px-3.5 py-1 text-xs font-medium text-[#070607] mb-3">
              DEVELOPER EXPERIENCE
            </span>
            <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-[#070607]">
              CONFIGURE YOUR ROLLUP
            </h2>
            <p className="mt-2 text-sm sm:text-base font-medium text-[#070607]/70">
              Customize the modular layers of your chain and get instant API deployment commands.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Options */}
            <div className="lg:col-span-6 space-y-6">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-[#070607]/60 block mb-3">
                  1. Execution Framework
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedFramework("nitro")}
                    className={`rounded-[20px] p-4 text-left border transition ${
                      selectedFramework === "nitro"
                        ? "bg-[#fc5000] text-[#070607] border-[#fc5000] font-bold"
                        : "bg-white text-[#070607] border-[#070607]/10 font-medium"
                    }`}
                  >
                    Arbitrum Nitro
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedFramework("op")}
                    className={`rounded-[20px] p-4 text-left border transition ${
                      selectedFramework === "op"
                        ? "bg-[#fc5000] text-[#070607] border-[#fc5000] font-bold"
                        : "bg-white text-[#070607] border-[#070607]/10 font-medium"
                    }`}
                  >
                    OP Stack
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedFramework("cdk")}
                    className={`rounded-[20px] p-4 text-left border transition ${
                      selectedFramework === "cdk"
                        ? "bg-[#fc5000] text-[#070607] border-[#fc5000] font-bold"
                        : "bg-white text-[#070607] border-[#070607]/10 font-medium"
                    }`}
                  >
                    Polygon CDK
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedFramework("zksync")}
                    className={`rounded-[20px] p-4 text-left border transition ${
                      selectedFramework === "zksync"
                        ? "bg-[#fc5000] text-[#070607] border-[#fc5000] font-bold"
                        : "bg-white text-[#070607] border-[#070607]/10 font-medium"
                    }`}
                  >
                    ZK Stack
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-[#070607]/60 block mb-3">
                  2. Data Availability Layer
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedDA("celestia")}
                    className={`rounded-[20px] p-3 text-center text-xs border transition ${
                      selectedDA === "celestia"
                        ? "bg-[#fc5000] text-[#070607] border-[#fc5000] font-bold"
                        : "bg-white text-[#070607] border-[#070607]/10 font-medium"
                    }`}
                  >
                    Celestia
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedDA("eigenda")}
                    className={`rounded-[20px] p-3 text-center text-xs border transition ${
                      selectedDA === "eigenda"
                        ? "bg-[#fc5000] text-[#070607] border-[#fc5000] font-bold"
                        : "bg-white text-[#070607] border-[#070607]/10 font-medium"
                    }`}
                  >
                    EigenDA
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedDA("blobs")}
                    className={`rounded-[20px] p-3 text-center text-xs border transition ${
                      selectedDA === "blobs"
                        ? "bg-[#fc5000] text-[#070607] border-[#fc5000] font-bold"
                        : "bg-white text-[#070607] border-[#070607]/10 font-medium"
                    }`}
                  >
                    EIP-4844 Blobs
                  </button>
                </div>
              </div>
            </div>

            {/* Code / API Command Preview */}
            <div className="lg:col-span-6 rounded-[32px] bg-[#070607] p-6 sm:p-8 text-white font-mono text-xs w-full overflow-x-auto">
              <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
                <span className="text-[#f5f28e]">CALDERA CLI / API DEPLOYMENT</span>
                <span className="text-white/40">POST /v1/rollups</span>
              </div>
              <pre className="text-white/80 leading-relaxed overflow-x-auto">
{`curl -X POST https://api.caldera.xyz/v1/rollups \\
  -H "Authorization: Bearer cld_live_token" \\
  -H "Content-Type: application/json" \\
  -d '{
    "chain_name": "my-app-chain",
    "framework": "${selectedFramework}",
    "da_layer": "${selectedDA}",
    "settlement": "ethereum_mainnet",
    "block_time_ms": 250,
    "native_fee_token": "CUSTOM_ERC20",
    "metalayer_enabled": true
  }'`}
              </pre>

              <div className="mt-6 pt-4 border-t border-white/10 flex justify-between items-center">
                <span className="text-white/50 text-[11px]">Ready to run locally or in cloud</span>
                <Link
                  href="/login"
                  className="rounded-[800px] bg-[#fc5000] px-4 py-2 text-xs font-bold text-[#070607] hover:opacity-90 transition font-sans"
                >
                  Deploy via Dashboard &rarr;
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Latest News & Blog Section (Content Cards) */}
        <section id="blog" className="flex flex-col gap-8">
          <div className="flex items-center justify-between">
            <div>
              <span className="inline-flex rounded-[800px] bg-[#f5f28e] px-3.5 py-1 text-xs font-medium text-[#070607] mb-2">
                INSIGHTS &amp; RESEARCH
              </span>
              <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-[#070607]">
                FROM THE LAB
              </h2>
            </div>
            <Link
              href="/app"
              className="hidden sm:inline-block text-sm font-bold text-[#070607] hover:text-[#fc5000] underline underline-offset-4"
            >
              View all posts &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {articles.map((art, idx) => (
              <div
                key={idx}
                className="rounded-[40px] bg-[#f7f6f2] p-8 border border-[#070607]/10 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-xs font-mono mb-6">
                    <span className="rounded-[800px] bg-[#f5f28e] px-3 py-1 font-medium text-[#070607]">
                      {art.tag}
                    </span>
                    <span className="text-[#070607]/60">{art.readTime}</span>
                  </div>

                  <h3 className="text-xl sm:text-2xl font-black uppercase text-[#070607] leading-tight">
                    {art.title}
                  </h3>
                </div>

                <div className="mt-8 pt-4 border-t border-[#070607]/10 text-xs font-mono text-[#070607]/60">
                  {art.date}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Dark Input Section: Stay Ahead with Pill Input Field */}
        <section className="rounded-[40px] bg-[#070607] p-10 sm:p-14 text-white">
          <div className="max-w-2xl mx-auto text-center flex flex-col items-center">
            <span className="inline-flex rounded-[800px] bg-[#fc5000] px-3.5 py-1 text-xs font-medium text-[#070607] mb-4">
              NEWSLETTER
            </span>
            <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-white">
              STAY AHEAD OF THE MODULAR REVOLUTION
            </h2>
            <p className="mt-4 text-sm sm:text-base font-medium text-white/70 max-w-lg">
              Get technical teardowns, framework releases, and ecosystem updates sent directly to your inbox.
            </p>

            {subscribed ? (
              <div className="mt-8 rounded-[100px] bg-[#f5f28e] text-[#070607] px-8 py-4 font-bold text-sm">
                ✓ Thank you for subscribing to Caldera updates!
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
                  className="rounded-[800px] bg-[#fc5000] px-8 py-3.5 text-sm font-medium text-[#070607] hover:opacity-90 transition shrink-0"
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
              <div className="h-6 w-6 rounded-md bg-[#fc5000] flex items-center justify-center text-white">
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                  <polygon points="12 2 2 22 22 22" />
                </svg>
              </div>
              <span className="text-xl font-black tracking-tight text-[#070607] uppercase">
                CALDERA
              </span>
            </Link>
            <p className="mt-4 text-xs font-medium text-[#070607]/70 max-w-sm leading-relaxed">
              Caldera is the modular rollup engine powering the next generation of high-throughput consumer and institutional decentralized applications.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#070607] mb-3">
              Products
            </h4>
            <ul className="space-y-2 text-xs font-medium text-[#070607]/70">
              <li><Link href="#engine" className="hover:text-[#fc5000]">Rollup Engine</Link></li>
              <li><Link href="#metalayer" className="hover:text-[#fc5000]">The Metalayer</Link></li>
              <li><Link href="#configurator" className="hover:text-[#fc5000]">Stack Configurator</Link></li>
              <li><Link href="/login" className="hover:text-[#fc5000]">Bridge UI</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#070607] mb-3">
              Developers
            </h4>
            <ul className="space-y-2 text-xs font-medium text-[#070607]/70">
              <li><a href="https://docs.caldera.xyz" target="_blank" rel="noreferrer" className="hover:text-[#fc5000]">Documentation</a></li>
              <li><Link href="/app" className="hover:text-[#fc5000]">API Reference</Link></li>
              <li><a href="https://github.com/calderaxyz" target="_blank" rel="noreferrer" className="hover:text-[#fc5000]">GitHub</a></li>
              <li><Link href="/login" className="hover:text-[#fc5000]">Status</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#070607] mb-3">
              Company
            </h4>
            <ul className="space-y-2 text-xs font-medium text-[#070607]/70">
              <li><Link href="#blog" className="hover:text-[#fc5000]">Blog</Link></li>
              <li><Link href="/app" className="hover:text-[#fc5000]">Careers</Link></li>
              <li><Link href="/terms" className="hover:text-[#fc5000]">Terms of Service</Link></li>
              <li><Link href="/privacy" className="hover:text-[#fc5000]">Privacy Policy</Link></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-[#070607]/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-medium text-[#070607]/60">
          <div>
            &copy; {new Date().getFullYear()} Caldera Technologies, Inc. All rights reserved.
          </div>
          <div className="flex gap-6">
            <a href="https://x.com/Calderaxyz" target="_blank" rel="noreferrer" className="hover:text-[#070607]">X / Twitter</a>
            <a href="https://discord.gg/caldera" target="_blank" rel="noreferrer" className="hover:text-[#070607]">Discord</a>
            <a href="https://t.me/calderaxyz" target="_blank" rel="noreferrer" className="hover:text-[#070607]">Telegram</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
