import Link from "next/link";

export default function TermsPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--background)] px-6 py-12 text-[var(--foreground)]">
      <div className="mx-auto max-w-3xl">
        <Link href="/" className="font-mono text-xs text-[var(--secondary)] hover:underline">
          &larr; Back to Home
        </Link>
        <h1 className="mt-4 text-3xl font-semibold">Terms of Service (Draft)</h1>
        <p className="mt-2 text-xs font-mono text-[var(--secondary)]">Last updated: November 2026 &bull; Testnet Environment</p>

        <div className="mt-6 flex flex-col gap-4 text-sm leading-relaxed text-[var(--secondary)]">
          <p>
            Half-Life is an open-source experimental software system participating in the Telegraph Hackathon Season II.
            All operations are conducted strictly on the Ethereum Sepolia testnet using testnet tokens (Sepolia ETH, testnet USDC).
          </p>
          <h2 className="mt-4 font-semibold text-base text-[var(--foreground)]">1. Testnet Operation Only</h2>
          <p>
            No real currency, assets, or financial value are accepted, processed, or held. All wallet balances, transactions, and settlement receipts represent testnet interactions.
          </p>
          <h2 className="mt-4 font-semibold text-base text-[var(--foreground)]">2. No Financial Advice or Warranty</h2>
          <p>
            The software, decision models, and data provided by the Freshness Atlas are provided &ldquo;as is&rdquo;, without warranty of any kind, express or implied.
          </p>
        </div>
      </div>
    </div>
  );
}

