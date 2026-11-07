"use client";

import Link from "next/link";
import { useState } from "react";

export default function Home() {
  const [activeTab, setActiveTab] = useState<"send" | "receive" | "card" | "business">("send");
  const [sendAmount, setSendAmount] = useState<string>("1,000");

  const countries = [
    { name: "United Kingdom", currency: "GBP", flag: "🇬🇧" },
    { name: "Eurozone", currency: "EUR", flag: "🇪🇺" },
    { name: "United States", currency: "USD", flag: "🇺🇸" },
    { name: "India", currency: "INR", flag: "🇮🇳" },
    { name: "Australia", currency: "AUD", flag: "🇦🇺" },
    { name: "Japan", currency: "JPY", flag: "🇯🇵" },
    { name: "Canada", currency: "CAD", flag: "🇨🇦" },
    { name: "Singapore", currency: "SGD", flag: "🇸🇬" },
    { name: "Switzerland", currency: "CHF", flag: "🇨🇭" },
    { name: "Brazil", currency: "BRL", flag: "🇧🇷" },
    { name: "Mexico", currency: "MXN", flag: "🇲🇽" },
    { name: "Philippines", currency: "PHP", flag: "🇵🇭" },
    { name: "South Africa", currency: "ZAR", flag: "🇿🇦" },
    { name: "United Arab Emirates", currency: "AED", flag: "🇦🇪" },
    { name: "New Zealand", currency: "NZD", flag: "🇳🇿" },
  ];

  return (
    <div className="min-h-screen bg-white text-[#0e0f0c] selection:bg-[#9fe870] selection:text-[#163300] font-sans antialiased">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 h-16 border-b border-[#e8ebe6] bg-white">
        <div className="mx-auto flex h-full max-w-[1200px] items-center justify-between px-6 lg:px-8">
          {/* Logo & Section Switcher */}
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2 group">
              <span className="text-2xl font-black tracking-tighter text-[#163300]">
                wise
              </span>
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#9fe870]" />
            </Link>

            {/* Segmented Pill Nav */}
            <div className="hidden md:flex items-center rounded-full bg-[#e8ebe6] p-1">
              <button
                type="button"
                className="rounded-full bg-[#9fe870] px-4 py-1.5 text-sm font-semibold text-[#163300] transition"
              >
                Personal
              </button>
              <button
                type="button"
                className="rounded-full px-4 py-1.5 text-sm font-medium text-[#454745] hover:text-[#163300] transition"
              >
                Business
              </button>
              <button
                type="button"
                className="rounded-full px-4 py-1.5 text-sm font-medium text-[#454745] hover:text-[#163300] transition"
              >
                Platform
              </button>
            </div>
          </div>

          {/* Right Cluster */}
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="hidden sm:flex items-center gap-2 text-sm font-medium text-[#454745] cursor-pointer hover:text-[#163300]">
              <span className="text-base">🌐</span>
              <span>EN</span>
            </div>

            <Link
              href="/app"
              className="hidden sm:inline-block text-sm font-medium text-[#454745] hover:text-[#163300]"
            >
              Help
            </Link>

            <Link
              href="/login"
              className="text-sm font-semibold text-[#163300] hover:underline underline-offset-4"
            >
              Log in
            </Link>

            <Link
              href="/login"
              className="rounded-full border border-[#163300] bg-white px-5 py-2 text-sm font-semibold text-[#163300] transition hover:bg-[#e8ebe6]"
            >
              Sign up
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex flex-col">
        {/* Hero Section */}
        <section className="pt-16 pb-20 px-6 lg:px-8 max-w-[1200px] mx-auto w-full text-center">
          {/* Display Headline */}
          <h1 className="text-5xl sm:text-7xl lg:text-[96px] font-black tracking-[-0.035em] leading-[0.88] text-[#0e0f0c] uppercase max-w-5xl mx-auto">
            MONEY FOR HERE, THERE AND EVERYWHERE
          </h1>

          {/* Subheading */}
          <p className="mt-8 text-lg sm:text-xl text-[#454745] max-w-2xl mx-auto leading-relaxed">
            160+ countries. 40 currencies. One account. Save when you send, spend and receive around the world.
          </p>

          {/* CTA Group */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-5">
            <Link
              href="/login"
              className="rounded-full bg-[#9fe870] px-8 py-3.5 text-base font-semibold text-[#163300] transition hover:opacity-90 shadow-sm"
            >
              Open an account
            </Link>
            <Link
              href="/login"
              className="text-base font-semibold text-[#163300] underline underline-offset-4 hover:opacity-80"
            >
              Send money now &rarr;
            </Link>
          </div>
        </section>

        {/* Interactive Segmented Calculator & Card Section */}
        <section className="py-12 px-6 lg:px-8 max-w-[1200px] mx-auto w-full">
          {/* Segmented Tab Control */}
          <div className="flex justify-center">
            <div className="inline-flex rounded-full bg-[#e8ebe6] p-1.5 gap-1">
              <button
                type="button"
                onClick={() => setActiveTab("send")}
                className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
                  activeTab === "send"
                    ? "bg-[#9fe870] text-[#163300]"
                    : "text-[#454745] hover:text-[#163300]"
                }`}
              >
                Send money
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("receive")}
                className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
                  activeTab === "receive"
                    ? "bg-[#9fe870] text-[#163300]"
                    : "text-[#454745] hover:text-[#163300]"
                }`}
              >
                Receive money
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("card")}
                className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
                  activeTab === "card"
                    ? "bg-[#9fe870] text-[#163300]"
                    : "text-[#454745] hover:text-[#163300]"
                }`}
              >
                Wise Card
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("business")}
                className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
                  activeTab === "business"
                    ? "bg-[#9fe870] text-[#163300]"
                    : "text-[#454745] hover:text-[#163300]"
                }`}
              >
                Large amounts
              </button>
            </div>
          </div>

          {/* Calculator Container on Fog */}
          <div className="mt-8 rounded-[28px] bg-[#e8ebe6] p-6 sm:p-10 border border-[#868685]/20 max-w-2xl mx-auto">
            {/* Send Amount Field */}
            <div>
              <label className="block text-xs font-semibold text-[#454745] uppercase tracking-wider mb-2">
                You send exactly
              </label>
              <div className="flex items-center justify-between rounded-[10px] border border-[#868685]/40 bg-white p-4 focus-within:border-[#163300] transition">
                <input
                  type="text"
                  value={sendAmount}
                  onChange={(e) => setSendAmount(e.target.value)}
                  className="w-full bg-transparent text-3xl font-bold text-[#0e0f0c] outline-none"
                />
                <div className="flex items-center gap-2 rounded-full bg-[#e8ebe6] px-3.5 py-1.5 font-bold text-[#163300] text-sm shrink-0">
                  <span>🇺🇸</span>
                  <span>USD</span>
                </div>
              </div>
            </div>

            {/* Calculation Breakdown */}
            <div className="my-5 pl-4 border-l-2 border-[#163300]/20 space-y-2 text-sm text-[#454745]">
              <div className="flex items-center justify-between">
                <span>Low cost fee</span>
                <span className="font-semibold text-[#0e0f0c]">$4.14 USD</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Guaranteed rate (24h)</span>
                <span className="font-semibold text-[#0e0f0c]">1 USD = 0.9238 EUR</span>
              </div>
              <div className="pt-1">
                <span className="inline-flex items-center rounded-full bg-[#e2f6d5] px-3 py-1 text-xs font-semibold text-[#163300]">
                  ⚡ You could save up to $38.50 vs traditional banks
                </span>
              </div>
            </div>

            {/* Recipient Gets Field */}
            <div>
              <label className="block text-xs font-semibold text-[#454745] uppercase tracking-wider mb-2">
                Recipient gets
              </label>
              <div className="flex items-center justify-between rounded-[10px] border border-[#868685]/40 bg-white p-4">
                <span className="text-3xl font-bold text-[#0e0f0c]">
                  919.98
                </span>
                <div className="flex items-center gap-2 rounded-full bg-[#e8ebe6] px-3.5 py-1.5 font-bold text-[#163300] text-sm shrink-0">
                  <span>🇪🇺</span>
                  <span>EUR</span>
                </div>
              </div>
            </div>

            {/* Calculator CTA */}
            <Link
              href="/login"
              className="mt-6 block w-full rounded-full bg-[#9fe870] py-4 text-center font-bold text-base text-[#163300] hover:opacity-90 transition shadow-sm"
            >
              Get started
            </Link>
          </div>
        </section>

        {/* Feature Row (3-column Trust Signal Block) */}
        <section className="py-20 px-6 lg:px-8 max-w-[1200px] mx-auto w-full border-t border-[#e8ebe6]">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
            {/* Feature 1 */}
            <div className="flex flex-col">
              <div className="h-6 w-6 text-[#454745]">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </div>
              <h3 className="mt-6 text-[18px] font-bold text-[#0e0f0c]">
                Transparent, low fees
              </h3>
              <p className="mt-2 text-[16px] text-[#868685] leading-relaxed">
                No hidden markup on exchange rates. What you see is what you pay, every single time.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="flex flex-col">
              <div className="h-6 w-6 text-[#454745]">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
              </div>
              <h3 className="mt-6 text-[18px] font-bold text-[#0e0f0c]">
                Fast and secure transfers
              </h3>
              <p className="mt-2 text-[16px] text-[#868685] leading-relaxed">
                Over 50% of transfers arrive instantly. Regulated by top financial authorities worldwide.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="flex flex-col">
              <div className="h-6 w-6 text-[#454745]">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="2" y1="12" x2="22" y2="12" />
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                </svg>
              </div>
              <h3 className="mt-6 text-[18px] font-bold text-[#0e0f0c]">
                Hold and spend in 40+ currencies
              </h3>
              <p className="mt-2 text-[16px] text-[#868685] leading-relaxed">
                Spend abroad with the Wise debit card without foreign transaction markup.
              </p>
            </div>
          </div>
        </section>

        {/* Dark Section Card (Inverted Surface for Emphasis) */}
        <section className="py-12 px-6 lg:px-8 max-w-[1200px] mx-auto w-full">
          <div className="rounded-[28px] bg-[#163300] p-10 md:p-14 text-white">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
              <div className="lg:col-span-7 flex flex-col gap-4">
                <span className="inline-flex items-center self-start rounded-full bg-[#054d28] border border-[#9fe870]/30 px-3.5 py-1 text-xs font-semibold text-[#9fe870]">
                  Global Banking Alternative
                </span>
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-[#9fe870] uppercase leading-tight">
                  A single account for everything global
                </h2>
                <p className="text-base sm:text-lg text-white/90 leading-relaxed max-w-xl">
                  Convert currencies instantly, receive local bank account details in 9+ currencies, and pay like a local wherever you travel.
                </p>

                <div className="pt-4">
                  <Link
                    href="/login"
                    className="inline-flex items-center rounded-full bg-[#9fe870] px-8 py-3.5 text-base font-bold text-[#163300] hover:opacity-90 transition"
                  >
                    Open an account
                  </Link>
                </div>
              </div>

              {/* Inset White Card for Currency Selector Pill */}
              <div className="lg:col-span-5">
                <div className="rounded-[10px] bg-white p-6 text-[#0e0f0c] shadow-xl">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#454745]">
                    Your Multi-Currency Details
                  </span>

                  {/* Currency Selector Pill */}
                  <div className="mt-4 flex items-center justify-between rounded-full border border-[#868685]/30 p-2 pl-3">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">🇬🇧</span>
                      <div>
                        <div className="text-sm font-bold text-[#0e0f0c]">British Pound</div>
                        <div className="text-xs text-[#868685]">Sort code 04-00-75</div>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="rounded-full border border-[#163300] px-4 py-1 text-xs font-bold text-[#163300] hover:bg-[#e8ebe6] transition"
                    >
                      Change
                    </button>
                  </div>

                  <div className="mt-4 space-y-2 border-t border-[#e8ebe6] pt-4 text-xs text-[#454745]">
                    <div className="flex justify-between">
                      <span>Account Number</span>
                      <span className="font-mono font-bold text-[#0e0f0c]">93821049</span>
                    </div>
                    <div className="flex justify-between">
                      <span>IBAN</span>
                      <span className="font-mono font-bold text-[#0e0f0c]">GB29 WISE 0400 7593 8210 49</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Country Grid (5-column Grid) */}
        <section className="py-20 px-6 lg:px-8 max-w-[1200px] mx-auto w-full">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-[#0e0f0c]">
              Send money to over 70 countries
            </h2>
            <p className="mt-3 text-base text-[#868685]">
              Real exchange rates, honest fees, delivered to bank accounts around the world.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-x-6 gap-y-8">
            {countries.map((c) => (
              <Link
                key={c.currency}
                href="/login"
                className="group flex flex-col items-center text-center"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#e8ebe6] text-3xl shadow-sm transition group-hover:scale-105">
                  {c.flag}
                </div>
                <span className="mt-3 text-sm font-semibold text-[#163300] group-hover:underline">
                  {c.name}
                </span>
                <span className="text-xs text-[#868685]">({c.currency})</span>
              </Link>
            ))}
          </div>
        </section>
      </main>

      {/* Floating QR Badge */}
      <aside className="fixed bottom-6 right-6 z-50 hidden sm:flex flex-col items-center gap-2 rounded-[16px] bg-[#163300] p-3.5 w-[124px] shadow-2xl border border-white/10">
        <div className="h-16 w-16 bg-white rounded-lg p-1.5 flex items-center justify-center">
          <svg viewBox="0 0 24 24" className="h-full w-full fill-[#163300]">
            <rect x="2" y="2" width="8" height="8" rx="1" />
            <rect x="14" y="2" width="8" height="8" rx="1" />
            <rect x="2" y="14" width="8" height="8" rx="1" />
            <rect x="14" y="14" width="4" height="4" />
            <rect x="18" y="18" width="4" height="4" />
          </svg>
        </div>
        <span className="text-[11px] font-semibold text-[#9fe870] text-center leading-tight">
          Get the Wise app
        </span>
      </aside>

      {/* Footer */}
      <footer className="border-t border-[#e8ebe6] bg-white py-12 px-6 lg:px-8">
        <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-sm text-[#868685]">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#163300]">wise</span>
            <span>&bull;</span>
            <span>&copy; {new Date().getFullYear()} Wise Payments Limited</span>
          </div>

          <div className="flex flex-wrap items-center gap-6">
            <Link href="/login" className="hover:text-[#163300] transition">
              Legal
            </Link>
            <Link href="/login" className="hover:text-[#163300] transition">
              Privacy Policy
            </Link>
            <Link href="/login" className="hover:text-[#163300] transition">
              Cookie Policy
            </Link>
            <Link href="/app" className="hover:text-[#163300] transition">
              Security
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
