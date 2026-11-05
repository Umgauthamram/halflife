import Link from "next/link";
import { getDb } from "../../lib/mongodb";
import { requireUser } from "../../lib/dal";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await requireUser();
  const db = await getDb();

  const agentsCount = await db.collection("agents").countDocuments({ ownerId: user.id });
  const purchasesCount = await db.collection("purchases").countDocuments({ ownerId: user.id });
  const decisionsCount = await db.collection("decisions").countDocuments({ ownerId: user.id });

  return (
    <div className="flex flex-col gap-8">
      {/* Page Title & Actions */}
      <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
          <p className="mt-1 text-sm text-[var(--secondary)]">
            Manage your autonomous intelligence agents and monitor freshness decisions.
          </p>
        </div>
        <Link
          href="/app/agents/new"
          className="rounded border border-[var(--border-strong)] bg-[var(--foreground)] px-4 py-2 text-sm font-medium text-[var(--background)] hover:opacity-90"
        >
          Create Agent
        </Link>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-4">
        <div className="border border-[var(--border)] bg-[var(--surface)] p-6">
          <span className="font-mono text-xs uppercase text-[var(--secondary)]">Active Agents</span>
          <div className="mt-2 text-3xl font-semibold">{agentsCount}</div>
        </div>
        <div className="border border-[var(--border)] bg-[var(--surface)] p-6">
          <span className="font-mono text-xs uppercase text-[var(--secondary)]">Verified Purchases</span>
          <div className="mt-2 text-3xl font-semibold">{purchasesCount}</div>
        </div>
        <div className="border border-[var(--border)] bg-[var(--surface)] p-6">
          <span className="font-mono text-xs uppercase text-[var(--secondary)]">Governor Decisions</span>
          <div className="mt-2 text-3xl font-semibold">{decisionsCount}</div>
        </div>
        <div className="border border-[var(--border)] bg-[var(--surface)] p-6">
          <span className="font-mono text-xs uppercase text-[var(--secondary)]">Spend Leaderboard</span>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-xl font-semibold text-green-700">Sepolia Proof</span>
            <Link href="/app/leaderboard" className="text-xs font-mono text-blue-600 hover:underline">
              View &rarr;
            </Link>
          </div>
        </div>
      </div>

      {/* Getting Started Guide if 0 agents */}
      {agentsCount === 0 && (
        <div className="border border-[var(--border)] bg-[var(--surface)] p-8">
          <h2 className="text-lg font-semibold">Get Started with Half-Life</h2>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-[var(--secondary)]">
            Create an agent to test automated recurring intelligence checks. You can run naive mode
            (buys every heartbeat) or Half-Life mode (buys only when decay exceeds miner noise floor and stake warrants it).
          </p>
          <div className="mt-6">
            <Link
              href="/app/agents/new"
              className="inline-flex rounded border border-[var(--border-strong)] bg-[var(--foreground)] px-4 py-2 text-sm font-medium text-[var(--background)] hover:opacity-90"
            >
              Create your first agent &rarr;
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

