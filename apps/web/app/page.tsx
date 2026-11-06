import Link from "next/link";

export default function Home() {
  const targetIntents = [
    { name: "FX_NOW", description: "Real-time currency exchange rates", window: "300s window" },
    { name: "WEATHER_FORECAST_VERIFY", description: "Verified meteorological forecasts", window: "3600s window" },
    { name: "SANCTIONS_SCREENING_MATCH", description: "OFAC and global sanctions screening", window: "86400s window" },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-[var(--background)] text-[var(--foreground)] selection:bg-[var(--foreground)] selection:text-[var(--background)]">
      {/* Top Banner */}
      <div className="border-b border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-center text-xs font-mono uppercase tracking-wider text-[var(--secondary)]">
        Telegraph Protocol &bull; Autonomous Freshness Decision Engine
      </div>

      {/* Navigation */}
      <header className="border-b border-[var(--border)] bg-[var(--surface)]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-8 lg:px-12 py-4">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-lg tracking-tight">Half-Life</span>
            <span className="rounded border border-[var(--border)] px-1.5 py-0.5 text-[11px] font-mono text-[var(--secondary)]">
              Atlas v0.1
            </span>
          </div>
          <nav className="flex items-center gap-6 text-sm">
            <Link href="#problem" className="text-[var(--secondary)] hover:text-[var(--foreground)]">
              Problem
            </Link>
            <Link href="#how-it-works" className="text-[var(--secondary)] hover:text-[var(--foreground)]">
              How it works
            </Link>
            <Link href="#atlas" className="text-[var(--secondary)] hover:text-[var(--foreground)]">
              Freshness Atlas
            </Link>
            <Link
              href="/login"
              className="rounded border border-[var(--border-strong)] bg-[var(--foreground)] px-4 py-1.5 text-sm font-medium text-[var(--background)] hover:opacity-90"
            >
              Sign In
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto flex max-w-7xl flex-1 flex-col px-8 lg:px-12 py-16">
        {/* Hero Section */}
        <section className="grid grid-cols-1 items-start gap-12 lg:grid-cols-12">
          <div className="flex flex-col gap-6 lg:col-span-7">
            <h1 className="text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
              Know when a bought answer has expired.
            </h1>
            <p className="text-lg leading-relaxed text-[var(--secondary)]">
              Every answer an agent buys starts going stale the moment it arrives. Half-Life measures how fast, and makes agents re-buy only when the cost of a stale answer is greater than the price of a fresh one.
            </p>
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded border border-[var(--border-strong)] bg-[var(--foreground)] px-6 py-3 text-base font-medium text-[var(--background)] hover:opacity-95"
              >
                Continue with Google
              </Link>
              <Link
                href="#how-it-works"
                className="inline-flex items-center justify-center rounded border border-[var(--border)] bg-[var(--surface)] px-6 py-3 text-base font-medium text-[var(--foreground)] hover:bg-[var(--background)]"
              >
                Read the Method
              </Link>
            </div>
          </div>

          {/* Live Preview Card */}
          <div className="rounded border border-[var(--border)] bg-[var(--surface)] p-6 lg:col-span-5">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <span className="text-xs font-mono uppercase tracking-wider text-[var(--secondary)]">
                Freshness Atlas Status
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs font-mono text-[var(--success)]">
                <span className="h-2 w-2 rounded-full bg-[var(--success)]"></span>
                Active Sampling
              </span>
            </div>
            <div className="mt-4 flex flex-col gap-3">
              {targetIntents.map((item) => (
                <div key={item.name} className="border border-[var(--border)] bg-[var(--background)] p-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-sm font-semibold">{item.name}</span>
                    <span className="text-xs font-mono text-[var(--secondary)]">{item.window}</span>
                  </div>
                  <p className="mt-1 text-xs text-[var(--secondary)]">{item.description}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 border-t border-[var(--border)] pt-3 text-[11px] text-[var(--secondary)]">
              Samples collected under strict noise-floor validation across Telegraph miners.
            </div>
          </div>
        </section>

        {/* The Problem */}
        <section id="problem" className="mt-28 border-t border-[var(--border)] pt-16">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-semibold tracking-tight">The Heartbeat Tax</h2>
            <p className="mt-4 text-base leading-relaxed text-[var(--secondary)]">
              A personal agent that checks the same things every few minutes (an FX rate, a weather forecast, a payee&apos;s sanctions status) buys the same answer hundreds of times a day when each answer is priced per request.
            </p>
            <p className="mt-3 text-base leading-relaxed text-[var(--secondary)]">
              Today, builders guess TTLs. Guessing too short drains the wallet with redundant queries. Guessing too long causes stale decisions on expired intelligence.
            </p>
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="mt-20 border-t border-[var(--border)] pt-16">
          <h2 className="text-2xl font-semibold tracking-tight">Four Steps to Verified Freshness</h2>
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="border border-[var(--border)] bg-[var(--surface)] p-6">
              <span className="font-mono text-xs text-[var(--secondary)]">01 / MEASURE</span>
              <h3 className="mt-2 font-semibold">Freshness Atlas</h3>
              <p className="mt-2 text-sm text-[var(--secondary)]">
                Samples Telegraph intents continuously to chart empirical drift curves and the miner noise floor.
              </p>
            </div>
            <div className="border border-[var(--border)] bg-[var(--surface)] p-6">
              <span className="font-mono text-xs text-[var(--secondary)]">02 / DECIDE</span>
              <h3 className="mt-2 font-semibold">The Governor</h3>
              <p className="mt-2 text-sm text-[var(--secondary)]">
                Evaluates risk: buys only when stake &times; expected drift &gt; price and drift &gt; noise floor.
              </p>
            </div>
            <div className="border border-[var(--border)] bg-[var(--surface)] p-6">
              <span className="font-mono text-xs text-[var(--secondary)]">03 / CAP</span>
              <h3 className="mt-2 font-semibold">Atomic Limits</h3>
              <p className="mt-2 text-sm text-[var(--secondary)]">
                Multi-layer spending controls: per-ask caps, daily budgets, and a hardware kill switch before signing.
              </p>
            </div>
            <div className="border border-[var(--border)] bg-[var(--surface)] p-6">
              <span className="font-mono text-xs text-[var(--secondary)]">04 / PROVE</span>
              <h3 className="mt-2 font-semibold">On-Chain Receipts</h3>
              <p className="mt-2 text-sm text-[var(--secondary)]">
                Every purchase is confirmed against on-chain transactions and attached with receipt and age.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--border)] bg-[var(--surface)] py-8 text-center text-xs text-[var(--secondary)]">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-8 lg:px-12 sm:flex-row">
          <div>Half-Life &bull; Telegraph Hackathon Season II (Track 03: Apps &amp; Agents)</div>
          <div className="flex gap-4">
            <span>On-Chain Verified</span>
            <span>&bull;</span>
            <span>Open Source (Apache-2.0)</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
