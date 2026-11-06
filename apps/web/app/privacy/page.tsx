import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--background)] px-6 py-12 text-[var(--foreground)]">
      <div className="mx-auto max-w-3xl">
        <Link href="/" className="font-mono text-xs text-[var(--secondary)] hover:underline">
          &larr; Back to Home
        </Link>
        <h1 className="mt-4 text-3xl font-semibold">Privacy Policy (Draft)</h1>
        <p className="mt-2 text-xs font-mono text-[var(--secondary)]">Last updated: November 2026</p>

        <div className="mt-6 flex flex-col gap-4 text-sm leading-relaxed text-[var(--secondary)]">
          <p>
            Half-Life takes privacy and least-privilege data collection seriously.
          </p>
          <h2 className="mt-4 font-semibold text-base text-[var(--foreground)]">1. Data We Collect</h2>
          <p>
            When you sign in using Google OpenID Connect, we store your Google subject ID, verified email address, name, and profile picture URL. We never store passwords or access non-essential scopes.
          </p>
          <h2 className="mt-4 font-semibold text-base text-[var(--foreground)]">2. Blockchain &amp; Public Ledger Data</h2>
          <p>
            Purchases made on the network are permanently recorded on the public blockchain by the nature of distributed ledger technology.
          </p>
        </div>
      </div>
    </div>
  );
}

