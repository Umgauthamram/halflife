"use client";

import Link from "next/link";
import { useState } from "react";

type Currency = "USD" | "GBP" | "EUR" | "AUD" | "CAD" | "INR" | "JPY";

interface CurrencyInfo {
  code: Currency;
  name: string;
  flag: string;
  symbol: string;
  rateToUSD: number; // 1 unit in USD
}

const CURRENCIES: Record<Currency, CurrencyInfo> = {
  USD: { code: "USD", name: "US Dollar", flag: "🇺🇸", symbol: "$", rateToUSD: 1.0 },
  GBP: { code: "GBP", name: "British Pound", flag: "🇬🇧", symbol: "£", rateToUSD: 1.28 },
  EUR: { code: "EUR", name: "Euro", flag: "🇪🇺", symbol: "€", rateToUSD: 1.08 },
  AUD: { code: "AUD", name: "Australian Dollar", flag: "🇦🇺", symbol: "A$", rateToUSD: 0.65 },
  CAD: { code: "CAD", name: "Canadian Dollar", flag: "🇨🇦", symbol: "C$", rateToUSD: 0.73 },
  INR: { code: "INR", name: "Indian Rupee", flag: "🇮🇳", symbol: "₹", rateToUSD: 0.012 },
  JPY: { code: "JPY", name: "Japanese Yen", flag: "🇯🇵", symbol: "¥", rateToUSD: 0.0065 },
};

export default function WiseLandingPage() {
  const [navSegment, setNavSegment] = useState<"personal" | "business" | "platform">("personal");
  const [calcTab, setCalcTab] = useState<"send" | "receive">("send");
  const [sendAmount, setSendAmount] = useState<string>("1000");
  const [fromCurr, setFromCurr] = useState<Currency>("USD");
  const [toCurr, setToCurr] = useState<Currency>("EUR");
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Dynamic conversion calculation
  const numericSend = parseFloat(sendAmount.replace(/,/g, "")) || 0;
  const exchangeRate = CURRENCIES[fromCurr].rateToUSD / CURRENCIES[toCurr].rateToUSD;
  const feeRate = 0.00414; // ~0.41%
  const fee = numericSend > 0 ? (numericSend * feeRate + 2.5).toFixed(2) : "0.00";
  const amountToConvert = Math.max(0, numericSend - parseFloat(fee));
  const recipientGets = (amountToConvert * exchangeRate).toFixed(2);
  const estimatedSavings = (numericSend * 0.0385).toFixed(2);

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

  const faqs = [
    {
      q: "How is Wise cheaper than traditional banks?",
      a: "Banks often hide charges in inflated exchange rates, claiming zero percent commission while taking an extra 3% to 6%. Wise uses the real mid-market exchange rate — the one you see on Google or Reuters — and only charges a small, transparent fee upfront.",
    },
    {
      q: "How fast will my international transfer arrive?",
      a: "Over 55% of transfers on Wise arrive instantly (in under 20 seconds). Depending on the currency and payment method you choose, most other transfers arrive within the same day.",
    },
    {
      q: "Is my money safe with Wise?",
      a: "Yes. Wise is heavily regulated by leading global financial authorities including the Financial Conduct Authority (FCA) in the UK, FinCEN and state banking regulators in the US, and FINTRAC in Canada. We safeguard all customer funds in segregated tier-one bank accounts.",
    },
    {
      q: "What is the Wise multi-currency account?",
      a: "It's an account that lets you hold over 40 currencies at once and gives you local bank details (account number, routing number, sort code, IBAN) in 9 currencies so anyone can pay you like a local.",
    },
  ];

  return (
    <div className="min-h-screen bg-white text-[#0e0f0c] selection:bg-[#9fe870] selection:text-[#163300] font-sans antialiased">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 h-16 border-b border-[#e8ebe6] bg-white">
        <div className="mx-auto flex h-full max-w-[1200px] items-center justify-between px-6 lg:px-8">
          {/* Brand Logo & Segmented Switcher */}
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-1.5 group">
              <span className="text-2xl font-black tracking-[-0.05em] text-[#163300] lowercase">
                wise
              </span>
              <span className="inline-block h-2 w-2 rounded-full bg-[#9fe870]" />
            </Link>

            {/* Segmented Tab Control (Pill container) */}
            <div className="hidden md:flex items-center rounded-full bg-[#e8ebe6] p-1">
              <button
                type="button"
                onClick={() => setNavSegment("personal")}
                className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
                  navSegment === "personal"
                    ? "bg-[#9fe870] text-[#163300]"
                    : "text-[#454745] hover:text-[#163300]"
                }`}
              >
                Personal
              </button>
              <button
                type="button"
                onClick={() => setNavSegment("business")}
                className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
                  navSegment === "business"
                    ? "bg-[#9fe870] text-[#163300]"
                    : "text-[#454745] hover:text-[#163300]"
                }`}
              >
                Business
              </button>
              <button
                type="button"
                onClick={() => setNavSegment("platform")}
                className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
                  navSegment === "platform"
                    ? "bg-[#9fe870] text-[#163300]"
                    : "text-[#454745] hover:text-[#163300]"
                }`}
              >
                Platform
              </button>
            </div>
          </div>

          {/* Right Nav Cluster */}
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="hidden lg:flex items-center gap-6 text-sm font-medium text-[#454745]">
              <Link href="#features" className="hover:text-[#163300] transition">
                Features
              </Link>
              <Link href="#pricing" className="hover:text-[#163300] transition">
                Pricing
              </Link>
              <Link href="/app" className="hover:text-[#163300] transition">
                Help
              </Link>
            </div>

            <div className="hidden sm:flex items-center gap-1.5 text-sm font-medium text-[#454745] cursor-pointer hover:text-[#163300]">
              <span className="text-base">🌐</span>
              <span>EN</span>
            </div>

            <Link
              href="/login"
              className="text-sm font-semibold text-[#163300] hover:underline underline-offset-4"
            >
              Log in
            </Link>

            {/* Outlined Pill Button */}
            <Link
              href="/login"
              className="rounded-full border border-[#163300] bg-white px-5 py-2 text-sm font-semibold text-[#163300] transition hover:bg-[#e8ebe6]"
            >
              Sign up
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex flex-col">
        <section className="pt-12 pb-20 px-6 lg:px-8 max-w-[1200px] mx-auto w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-14 items-center">
            {/* Left Column: Headlines & Actions */}
            <div className="lg:col-span-6 flex flex-col items-start">
              <span className="inline-flex items-center gap-2 rounded-full bg-[#e2f6d5] px-3.5 py-1 text-xs font-bold text-[#163300] mb-6">
                <span>⚡</span> The cheap, fast way to send money abroad
              </span>

              {/* Display Headline */}
              <h1 className="text-5xl sm:text-6xl lg:text-[76px] font-black tracking-[-0.035em] leading-[0.92] text-[#0e0f0c] uppercase">
                Save when you send money abroad
              </h1>

              {/* Subheading */}
              <p className="mt-6 text-lg sm:text-xl text-[#454745] leading-relaxed">
                Save up to 6x compared to traditional banks. Get the real exchange rate with transparent, low fees every single time.
              </p>

              {/* CTA Group */}
              <div className="mt-8 flex flex-wrap items-center gap-5">
                {/* Primary CTA Pill Button */}
                <Link
                  href="/login"
                  className="rounded-full bg-[#9fe870] px-8 py-3.5 text-base font-semibold text-[#163300] transition hover:opacity-90 shadow-sm"
                >
                  Open an account
                </Link>

                {/* Text Link Button */}
                <Link
                  href="#calculator"
                  className="text-base font-semibold text-[#163300] underline underline-offset-4 hover:opacity-80"
                >
                  Compare our fees &rarr;
                </Link>
              </div>

              {/* Trustpilot Review Badge */}
              <div className="mt-10 flex items-center gap-3 pt-6 border-t border-[#e8ebe6] w-full">
                <div className="flex gap-1 text-[#054d28]">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="text-lg">★</span>
                  ))}
                </div>
                <div className="text-xs text-[#454745]">
                  <span className="font-bold text-[#0e0f0c]">4.3 / 5</span> on Trustpilot &bull; Over 250,000+ reviews
                </div>
              </div>
            </div>

            {/* Right Column: Authentic Wise Transfer Calculator */}
            <div id="calculator" className="lg:col-span-6 w-full">
              <div className="rounded-[28px] bg-[#e8ebe6] p-6 sm:p-8 border border-[#868685]/20 shadow-md">
                {/* Calculator Tabs */}
                <div className="flex rounded-full bg-white/70 p-1 mb-6 max-w-xs">
                  <button
                    type="button"
                    onClick={() => setCalcTab("send")}
                    className={`flex-1 rounded-full py-2 text-xs font-bold transition ${
                      calcTab === "send"
                        ? "bg-[#9fe870] text-[#163300] shadow-sm"
                        : "text-[#454745] hover:text-[#163300]"
                    }`}
                  >
                    Send money
                  </button>
                  <button
                    type="button"
                    onClick={() => setCalcTab("receive")}
                    className={`flex-1 rounded-full py-2 text-xs font-bold transition ${
                      calcTab === "receive"
                        ? "bg-[#9fe870] text-[#163300] shadow-sm"
                        : "text-[#454745] hover:text-[#163300]"
                    }`}
                  >
                    Receive money
                  </button>
                </div>

                {/* You Send Exactly Field */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-bold text-[#454745] uppercase tracking-wider">
                      You send exactly
                    </label>
                  </div>
                  <div className="flex items-center justify-between rounded-[10px] border border-[#868685]/30 bg-white p-3.5 focus-within:border-[#163300] transition">
                    <input
                      type="text"
                      value={sendAmount}
                      onChange={(e) => setSendAmount(e.target.value)}
                      className="w-full bg-transparent text-2xl sm:text-3xl font-black text-[#0e0f0c] outline-none"
                    />
                    <select
                      value={fromCurr}
                      onChange={(e) => setFromCurr(e.target.value as Currency)}
                      aria-label="Send currency"
                      className="rounded-full bg-[#e8ebe6] px-3.5 py-1.5 font-bold text-[#163300] text-sm shrink-0 border-none outline-none cursor-pointer hover:bg-[#d8dcda] transition"
                    >
                      <option value="USD">🇺🇸 USD</option>
                      <option value="GBP">🇬🇧 GBP</option>
                      <option value="EUR">🇪🇺 EUR</option>
                      <option value="AUD">🇦🇺 AUD</option>
                      <option value="CAD">🇨🇦 CAD</option>
                    </select>
                  </div>
                </div>

                {/* Breakdown Calculation Tree */}
                <div className="my-4 pl-4 border-l-2 border-[#163300]/25 space-y-2 text-xs sm:text-sm text-[#454745]">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <span className="text-[#cb272f] font-bold">&minus;</span> Low cost fee ({CURRENCIES[fromCurr].code})
                    </span>
                    <span className="font-semibold text-[#0e0f0c]">
                      {CURRENCIES[fromCurr].symbol}{fee}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <span className="text-[#163300] font-bold">&equals;</span> Amount we&apos;ll convert
                    </span>
                    <span className="font-semibold text-[#0e0f0c]">
                      {CURRENCIES[fromCurr].symbol}{amountToConvert.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <span className="text-[#054d28] font-bold">&times;</span> Guaranteed rate (24h)
                    </span>
                    <span className="font-bold text-[#163300]">
                      1 {fromCurr} = {exchangeRate.toFixed(4)} {toCurr}
                    </span>
                  </div>
                </div>

                {/* Recipient Gets Field */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-bold text-[#454745] uppercase tracking-wider">
                      Recipient gets
                    </label>
                  </div>
                  <div className="flex items-center justify-between rounded-[10px] border border-[#868685]/30 bg-white p-3.5">
                    <span className="text-2xl sm:text-3xl font-black text-[#0e0f0c]">
                      {recipientGets}
                    </span>
                    <select
                      value={toCurr}
                      onChange={(e) => setToCurr(e.target.value as Currency)}
                      aria-label="Recipient currency"
                      className="rounded-full bg-[#e8ebe6] px-3.5 py-1.5 font-bold text-[#163300] text-sm shrink-0 border-none outline-none cursor-pointer hover:bg-[#d8dcda] transition"
                    >
                      <option value="EUR">🇪🇺 EUR</option>
                      <option value="GBP">🇬🇧 GBP</option>
                      <option value="USD">🇺🇸 USD</option>
                      <option value="INR">🇮🇳 INR</option>
                      <option value="JPY">🇯🇵 JPY</option>
                      <option value="AUD">🇦🇺 AUD</option>
                    </select>
                  </div>
                </div>

                {/* Savings Callout Pill */}
                <div className="mt-4 flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#e2f6d5] px-3 py-1 text-xs font-bold text-[#163300]">
                    ⚡ You could save ~${estimatedSavings} vs banks
                  </span>
                  <span className="text-xs font-medium text-[#868685]">
                    Arrives in seconds
                  </span>
                </div>

                {/* Calculator CTA Button */}
                <Link
                  href="/login"
                  className="mt-6 block w-full rounded-full bg-[#9fe870] py-4 text-center font-bold text-base text-[#163300] hover:opacity-90 transition shadow-sm"
                >
                  Get started
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Global Scale Marquee Metrics */}
        <section className="bg-[#e8ebe6] py-10 border-y border-[#868685]/15">
          <div className="max-w-[1200px] mx-auto px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              <div>
                <div className="text-3xl sm:text-4xl font-black text-[#163300]">16 Million+</div>
                <div className="text-xs sm:text-sm text-[#454745] mt-1 font-medium">People &amp; businesses worldwide</div>
              </div>
              <div>
                <div className="text-3xl sm:text-4xl font-black text-[#163300]">$120 Billion+</div>
                <div className="text-xs sm:text-sm text-[#454745] mt-1 font-medium">Transferred every single year</div>
              </div>
              <div>
                <div className="text-3xl sm:text-4xl font-black text-[#163300]">$1.5 Billion</div>
                <div className="text-xs sm:text-sm text-[#454745] mt-1 font-medium">Saved in hidden bank fees</div>
              </div>
              <div>
                <div className="text-3xl sm:text-4xl font-black text-[#163300]">70+ Countries</div>
                <div className="text-xs sm:text-sm text-[#454745] mt-1 font-medium">Over 40 supported currencies</div>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Row (3-column Trust Signal Block) */}
        <section id="features" className="py-20 px-6 lg:px-8 max-w-[1200px] mx-auto w-full">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-black text-[#0e0f0c] uppercase tracking-tight">
              Why millions choose Wise
            </h2>
            <p className="mt-3 text-base text-[#454745]">
              Built to make money move without borders, fairly and transparently.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-12">
            {/* Feature 1 */}
            <div className="flex flex-col">
              <div className="h-10 w-10 text-[#163300] flex items-center justify-center rounded-full bg-[#e2f6d5]">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </div>
              <h3 className="mt-6 text-[18px] font-bold text-[#0e0f0c]">
                Transparent, low fees
              </h3>
              <p className="mt-2 text-[16px] text-[#868685] leading-relaxed">
                No hidden exchange rate markups. What you see is what you pay, down to the exact cent, every single time.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="flex flex-col">
              <div className="h-10 w-10 text-[#163300] flex items-center justify-center rounded-full bg-[#e2f6d5]">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
              </div>
              <h3 className="mt-6 text-[18px] font-bold text-[#0e0f0c]">
                Fast and secure transfers
              </h3>
              <p className="mt-2 text-[16px] text-[#868685] leading-relaxed">
                Over 55% of transfers arrive in seconds. Heavily safeguarded and regulated by financial authorities worldwide.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="flex flex-col">
              <div className="h-10 w-10 text-[#163300] flex items-center justify-center rounded-full bg-[#e2f6d5]">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="2" y1="12" x2="22" y2="12" />
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                </svg>
              </div>
              <h3 className="mt-6 text-[18px] font-bold text-[#0e0f0c]">
                Hold and spend 40+ currencies
              </h3>
              <p className="mt-2 text-[16px] text-[#868685] leading-relaxed">
                Keep balances across global currencies and convert between them whenever the exchange rate is in your favor.
              </p>
            </div>
          </div>
        </section>

        {/* Dark Section Card ("Forest Ink" #163300) */}
        <section className="py-12 px-6 lg:px-8 max-w-[1200px] mx-auto w-full">
          <div className="rounded-[28px] bg-[#163300] p-8 sm:p-12 md:p-16 text-white shadow-xl">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
              <div className="lg:col-span-7 flex flex-col gap-4">
                <span className="inline-flex items-center self-start rounded-full bg-[#054d28] border border-[#9fe870]/30 px-3.5 py-1 text-xs font-bold text-[#9fe870]">
                  Global Multi-Currency Account
                </span>
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-[#9fe870] uppercase leading-tight">
                  Meet the account for international people
                </h2>
                <p className="text-base sm:text-lg text-white/90 leading-relaxed max-w-xl">
                  Get local bank account details in 9+ currencies including GBP, EUR, USD, AUD, CAD, and SGD. Receive your salary, client invoices, or pension like a local without paying conversion fees.
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
                <div className="rounded-[10px] bg-white p-6 text-[#0e0f0c] shadow-2xl">
                  <div className="flex items-center justify-between pb-3 border-b border-[#e8ebe6]">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#454745]">
                      Local Account Details
                    </span>
                    <span className="text-[11px] font-bold text-[#163300] bg-[#e2f6d5] px-2 py-0.5 rounded-full">
                      Free to receive
                    </span>
                  </div>

                  {/* Currency Selector Pill */}
                  <div className="mt-4 flex items-center justify-between rounded-full border border-[#868685]/30 p-2.5 pl-3">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">🇬🇧</span>
                      <div>
                        <div className="text-sm font-bold text-[#0e0f0c]">British Pound</div>
                        <div className="text-xs text-[#868685]">Sort code 04-00-75</div>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="rounded-full border border-[#163300] px-3.5 py-1 text-xs font-bold text-[#163300] hover:bg-[#e8ebe6] transition"
                    >
                      Change
                    </button>
                  </div>

                  {/* Sample Account Information */}
                  <div className="mt-4 space-y-3 pt-2 text-xs text-[#454745]">
                    <div className="flex justify-between items-center py-1 border-b border-[#e8ebe6]/60">
                      <span>Account Number</span>
                      <span className="font-mono font-bold text-[#0e0f0c]">93821049</span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-[#e8ebe6]/60">
                      <span>Routing / Sort Code</span>
                      <span className="font-mono font-bold text-[#0e0f0c]">04-00-75</span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span>IBAN</span>
                      <span className="font-mono font-bold text-[#0e0f0c]">GB29 WISE 0400 7593 8210 49</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section: The Wise Card (Physical & Digital Debit Card) */}
        <section className="py-20 px-6 lg:px-8 max-w-[1200px] mx-auto w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-6 flex flex-col gap-4">
              <span className="inline-flex items-center self-start rounded-full bg-[#e8ebe6] px-3.5 py-1 text-xs font-bold text-[#163300]">
                Wise Debit Card
              </span>
              <h2 className="text-3xl sm:text-5xl font-black text-[#0e0f0c] uppercase tracking-tight leading-tight">
                Spend in 150+ countries with the Wise card
              </h2>
              <p className="text-base sm:text-lg text-[#454745] leading-relaxed mt-2">
                Pay like a local anywhere Visa and Mastercard are accepted. If you don&apos;t hold the currency, smart auto-conversion picks the balance with the lowest conversion fee.
              </p>

              <div className="mt-4 space-y-3">
                <div className="flex items-center gap-3 text-sm text-[#0e0f0c] font-medium">
                  <span className="text-[#163300] font-bold">✓</span> Free ATM withdrawals up to $100 every month
                </div>
                <div className="flex items-center gap-3 text-sm text-[#0e0f0c] font-medium">
                  <span className="text-[#163300] font-bold">✓</span> Zero foreign transaction fees or hidden markups
                </div>
                <div className="flex items-center gap-3 text-sm text-[#0e0f0c] font-medium">
                  <span className="text-[#163300] font-bold">✓</span> Instant digital cards for secure online checkouts
                </div>
                <div className="flex items-center gap-3 text-sm text-[#0e0f0c] font-medium">
                  <span className="text-[#163300] font-bold">✓</span> Freeze and unfreeze your card anytime in 1 click
                </div>
              </div>

              <div className="pt-4">
                <Link
                  href="/login"
                  className="inline-flex rounded-full bg-[#9fe870] px-8 py-3.5 text-base font-bold text-[#163300] hover:opacity-90 transition shadow-sm"
                >
                  Order your card
                </Link>
              </div>
            </div>

            {/* Visual Card Mockup */}
            <div className="lg:col-span-6 flex justify-center">
              <div className="relative w-full max-w-md aspect-[1.586] rounded-[24px] bg-[#9fe870] p-8 text-[#163300] shadow-2xl flex flex-col justify-between overflow-hidden border border-[#163300]/10">
                <div className="flex justify-between items-start">
                  <span className="text-3xl font-black tracking-[-0.05em]">wise</span>
                  {/* Contactless symbol */}
                  <div className="text-2xl font-bold">)))</div>
                </div>

                {/* EMV Chip */}
                <div className="w-12 h-9 rounded-md bg-[#054d28]/30 border border-[#163300]/20 flex items-center justify-center">
                  <div className="w-8 h-5 border border-[#163300]/30 rounded-sm" />
                </div>

                <div className="flex justify-between items-end">
                  <div>
                    <div className="font-mono text-lg font-bold tracking-widest text-[#163300]">
                      •••• 8492
                    </div>
                    <div className="text-xs uppercase tracking-wider font-semibold text-[#163300]/80 mt-1">
                      INTERNATIONAL DEBIT
                    </div>
                  </div>
                  <div className="text-xl font-black italic tracking-wider">
                    VISA
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Country Grid (5-column Grid) */}
        <section id="pricing" className="py-20 px-6 lg:px-8 max-w-[1200px] mx-auto w-full border-t border-[#e8ebe6]">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-[#0e0f0c] uppercase">
              Send money to over 70 countries
            </h2>
            <p className="mt-3 text-base text-[#868685]">
              Real mid-market exchange rates, transparent fees, delivered directly to bank accounts worldwide.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-x-6 gap-y-10">
            {countries.map((c) => (
              <Link
                key={c.currency}
                href="/login"
                className="group flex flex-col items-center text-center"
              >
                {/* Circular Flag Thumbnail (56px diameter, 1000px radius) */}
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#e8ebe6] text-3xl shadow-sm transition group-hover:scale-105">
                  {c.flag}
                </div>
                {/* Country Name (Inter 500 at 16px Forest Ink, underline on hover) */}
                <span className="mt-3 text-base font-medium text-[#163300] group-hover:underline">
                  {c.name}
                </span>
                <span className="text-xs text-[#868685]">({c.currency})</span>
              </Link>
            ))}
          </div>
        </section>

        {/* Wise Business Section */}
        <section className="py-12 px-6 lg:px-8 max-w-[1200px] mx-auto w-full">
          <div className="rounded-[28px] bg-[#e8ebe6] p-10 md:p-14 border border-[#868685]/20">
            <div className="max-w-2xl">
              <span className="inline-flex items-center rounded-full bg-[#e2f6d5] px-3.5 py-1 text-xs font-bold text-[#163300] mb-4">
                Wise Business
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-[#0e0f0c] uppercase tracking-tight">
                Built for companies with global ambitions
              </h2>
              <p className="mt-4 text-base sm:text-lg text-[#454745] leading-relaxed">
                Pay overseas suppliers, collect foreign customer revenue, and automate your multi-currency payroll — all with the lowest transfer fees on the market.
              </p>

              <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm font-semibold text-[#0e0f0c]">
                <div className="bg-white rounded-[10px] p-4 border border-[#868685]/20">
                  <div className="text-lg mb-1">⚡</div>
                  Batch pay 1,000 invoices at once
                </div>
                <div className="bg-white rounded-[10px] p-4 border border-[#868685]/20">
                  <div className="text-lg mb-1">🔗</div>
                  Sync with Xero, QuickBooks &amp; Stripe
                </div>
                <div className="bg-white rounded-[10px] p-4 border border-[#868685]/20">
                  <div className="text-lg mb-1">🛡️</div>
                  Multi-user roles and approvals
                </div>
              </div>

              <div className="mt-8 flex gap-4">
                <Link
                  href="/login"
                  className="rounded-full bg-[#163300] text-white px-8 py-3.5 text-base font-bold hover:bg-[#054d28] transition"
                >
                  Explore Wise Business
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-20 px-6 lg:px-8 max-w-[1200px] mx-auto w-full">
          <div className="text-center max-w-xl mx-auto mb-12">
            <h2 className="text-3xl sm:text-4xl font-black text-[#0e0f0c] uppercase tracking-tight">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="max-w-3xl mx-auto divide-y divide-[#e8ebe6]">
            {faqs.map((faq, index) => (
              <div key={index} className="py-5">
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="flex w-full items-center justify-between text-left text-lg font-bold text-[#0e0f0c] hover:text-[#163300] transition"
                >
                  <span>{faq.q}</span>
                  <span className="text-2xl font-normal text-[#163300] ml-4">
                    {openFaq === index ? "−" : "+"}
                  </span>
                </button>
                {openFaq === index && (
                  <p className="mt-3 text-base text-[#454745] leading-relaxed">
                    {faq.a}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Floating QR Badge (Fixed Bottom-Right) */}
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

      {/* Comprehensive Wise Footer */}
      <footer className="border-t border-[#e8ebe6] bg-white py-16 px-6 lg:px-8">
        <div className="max-w-[1200px] mx-auto">
          {/* Main Footer Links Columns */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-12">
            <div>
              <h4 className="text-sm font-bold text-[#0e0f0c] uppercase tracking-wider mb-4">
                Transfer Money
              </h4>
              <ul className="space-y-2.5 text-sm text-[#454745]">
                <li><Link href="/login" className="hover:text-[#163300]">Send money abroad</Link></li>
                <li><Link href="/login" className="hover:text-[#163300]">Receive money</Link></li>
                <li><Link href="/login" className="hover:text-[#163300]">Wise debit card</Link></li>
                <li><Link href="/login" className="hover:text-[#163300]">Large amount transfers</Link></li>
                <li><Link href="/login" className="hover:text-[#163300]">Wise Business</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-bold text-[#0e0f0c] uppercase tracking-wider mb-4">
                Tools &amp; Features
              </h4>
              <ul className="space-y-2.5 text-sm text-[#454745]">
                <li><Link href="#calculator" className="hover:text-[#163300]">Currency converter</Link></li>
                <li><Link href="#pricing" className="hover:text-[#163300]">Swift / BIC codes</Link></li>
                <li><Link href="#pricing" className="hover:text-[#163300]">IBAN codes</Link></li>
                <li><Link href="/app" className="hover:text-[#163300]">Exchange rate alerts</Link></li>
                <li><Link href="/app" className="hover:text-[#163300]">Compare exchange rates</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-bold text-[#0e0f0c] uppercase tracking-wider mb-4">
                Company
              </h4>
              <ul className="space-y-2.5 text-sm text-[#454745]">
                <li><Link href="/login" className="hover:text-[#163300]">About Wise</Link></li>
                <li><Link href="/login" className="hover:text-[#163300]">Security</Link></li>
                <li><Link href="/login" className="hover:text-[#163300]">Careers</Link></li>
                <li><Link href="/login" className="hover:text-[#163300]">Press</Link></li>
                <li><Link href="/login" className="hover:text-[#163300]">Modern slavery statement</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-bold text-[#0e0f0c] uppercase tracking-wider mb-4">
                Legal &amp; Privacy
              </h4>
              <ul className="space-y-2.5 text-sm text-[#454745]">
                <li><Link href="/privacy" className="hover:text-[#163300]">Privacy policy</Link></li>
                <li><Link href="/terms" className="hover:text-[#163300]">Terms &amp; conditions</Link></li>
                <li><Link href="/terms" className="hover:text-[#163300]">Cookie policy</Link></li>
                <li><Link href="/app" className="hover:text-[#163300]">Complaints policy</Link></li>
                <li><Link href="/app" className="hover:text-[#163300]">Customer support</Link></li>
              </ul>
            </div>
          </div>

          {/* Legal Disclaimers & Regulation Notice (Pebble #868685) */}
          <div className="pt-8 border-t border-[#e8ebe6] text-xs text-[#868685] leading-relaxed space-y-3">
            <p>
              Wise Payments Limited is authorised and regulated by the Financial Conduct Authority under the Electronic Money Regulations 2011, Firm Reference 900508, for the issuing of electronic money. In the United States, Wise US Inc. is registered with FinCEN and licensed as a money transmitter in respective states.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
              <div className="flex items-center gap-2 font-medium text-[#454745]">
                <span className="font-bold text-[#163300]">wise</span>
                <span>&bull;</span>
                <span>&copy; {new Date().getFullYear()} Wise Payments Limited. All rights reserved.</span>
              </div>
              <div className="flex items-center gap-4 text-[#454745]">
                <span>Status: All systems operational</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
