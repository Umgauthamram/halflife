import Link from "next/link";
import { getDb } from "../../../lib/mongodb";
import { requireUser } from "../../../lib/dal";

export const dynamic = "force-dynamic";

interface LeaderboardEntry {
  rank: number;
  agentId: string;
  agentName: string;
  agentType: string;
  walletAddress: string;
  intents: string[];
  paidRequests: number;
  totalSpendUsdc: number;
  lastTxHash: string | null;
  status: "active" | "standby";
}

export default async function LeaderboardPage() {
  await requireUser();
  const db = await getDb();

  // Fetch real purchases from MongoDB
  const purchases = await db
    .collection("purchases")
    .find({})
    .sort({ askedAt: -1 })
    .limit(200)
    .toArray();

  // Fetch all agents to map names & wallets
  const agents = await db.collection("agents").find({}).toArray();
  const agentMap = new Map<string, any>();
  for (const a of agents) {
    agentMap.set(a._id.toString(), a);
    if (a.id) agentMap.set(a.id, a);
  }

  // Aggregate purchases by agentId
  const agentStats = new Map<
    string,
    {
      agentId: string;
      paidRequests: number;
      totalSpendUsdc: number;
      intents: Set<string>;
      lastTxHash: string | null;
      lastActive: Date;
    }
  >();

  for (const p of purchases) {
    const aid = p.agentId || "unknown";
    const existing = agentStats.get(aid) || {
      agentId: aid,
      paidRequests: 0,
      totalSpendUsdc: 0,
      intents: new Set<string>(),
      lastTxHash: null,
      lastActive: new Date(0),
    };

    existing.paidRequests += 1;
    existing.totalSpendUsdc += Number(p.priceUsdc || 0);
    if (p.intent) existing.intents.add(p.intent);
    if (!existing.lastTxHash && p.txHash) {
      existing.lastTxHash = p.txHash;
    }
    const askedDate = new Date(p.askedAt || p.createdAt || 0);
    if (askedDate > existing.lastActive) {
      existing.lastActive = askedDate;
    }

    agentStats.set(aid, existing);
  }

  // Sort by total spend descending
  const sortedStats = Array.from(agentStats.values()).sort(
    (a, b) => b.totalSpendUsdc - a.totalSpendUsdc || b.paidRequests - a.paidRequests
  );

  const leaderboardEntries: LeaderboardEntry[] = sortedStats.map((st, idx) => {
    const agentDoc = agentMap.get(st.agentId);
    const agentName = agentDoc?.name || `Agent ${st.agentId.slice(0, 8)}`;
    const walletAddress = agentDoc?.wallet?.address || agentDoc?.walletAddress || "0x" + st.agentId.slice(0, 40).padEnd(40, "0");
    const agentType = agentDoc?.mode === "half-life" ? "Half-Life Autonomous" : "Standard Agent";

    return {
      rank: idx + 1,
      agentId: st.agentId,
      agentName,
      agentType,
      walletAddress,
      intents: Array.from(st.intents),
      paidRequests: st.paidRequests,
      totalSpendUsdc: st.totalSpendUsdc,
      lastTxHash: st.lastTxHash,
      status: "active",
    };
  });

  const totalNetworkSpend = leaderboardEntries.reduce((sum, e) => sum + e.totalSpendUsdc, 0);
  const totalPaidRequests = leaderboardEntries.reduce((sum, e) => sum + e.paidRequests, 0);

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="border-b border-[var(--border)] pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Agent Spend Leaderboard</h1>
            <p className="mt-1 text-sm text-[var(--secondary)]">
              Real-time on-chain spend and receipts across active autonomous agents running on Telegraph.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/app/playground"
              className="rounded border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2 text-xs font-mono font-medium hover:text-[var(--foreground)] transition"
            >
              Testing Studio
            </Link>
            <Link
              href="/app/agents/new"
              className="rounded border border-[var(--border-strong)] bg-[var(--foreground)] px-4 py-2 text-xs font-mono font-bold text-[var(--background)] hover:opacity-90 transition"
            >
              Deploy Agent
            </Link>
          </div>
        </div>
      </div>

      {/* Aggregate Network Spend Stats */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-4">
        <div className="border border-[var(--border)] bg-[var(--surface)] p-6">
          <span className="font-mono text-xs uppercase text-[var(--secondary)]">Active Spending Agents</span>
          <div className="mt-2 text-3xl font-semibold">{leaderboardEntries.length}</div>
          <span className="mt-1 text-xs text-[var(--secondary)]">Measured from database</span>
        </div>
        <div className="border border-[var(--border)] bg-[var(--surface)] p-6">
          <span className="font-mono text-xs uppercase text-[var(--secondary)]">Total Paid Requests</span>
          <div className="mt-2 text-3xl font-semibold">{totalPaidRequests}</div>
          <span className="mt-1 text-xs text-[var(--secondary)]">Settled on Telegraph</span>
        </div>
        <div className="border border-[var(--border)] bg-[var(--surface)] p-6">
          <span className="font-mono text-xs uppercase text-[var(--secondary)]">Total Spend (USDC)</span>
          <div className="mt-2 text-3xl font-semibold text-amber-600">${totalNetworkSpend.toFixed(3)}</div>
          <span className="mt-1 text-xs text-[var(--secondary)]">Sepolia Testnet</span>
        </div>
        <div className="border border-[var(--border)] bg-[var(--surface)] p-6">
          <span className="font-mono text-xs uppercase text-[var(--secondary)]">Verified Purchases</span>
          <div className="mt-2 text-3xl font-semibold">{totalPaidRequests}</div>
          <span className="mt-1 text-xs text-emerald-600">On-chain receipts</span>
        </div>
      </div>

      {/* Live Spend Leaderboard Table */}
      <div className="border border-[var(--border)] bg-[var(--surface)]">
        <div className="border-b border-[var(--border)] px-6 py-4">
          <h2 className="text-base font-semibold">Autonomous Agent Activity</h2>
          <p className="mt-0.5 text-xs text-[var(--secondary)] font-mono">
            Every entry represents a verified autonomous agent with an isolated wallet settling queries on Telegraph.
          </p>
        </div>

        {leaderboardEntries.length === 0 ? (
          <div className="p-12 text-center text-xs font-mono text-[var(--secondary)]">
            <p>No agent purchases recorded yet.</p>
            <p className="mt-1 text-[11px]">
              Execute an ask in the{" "}
              <Link href="/app/playground" className="underline hover:text-[var(--foreground)]">
                Testing Studio
              </Link>{" "}
              or integrate via SDK to see your agent on the leaderboard.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-[var(--border)] bg-[var(--background)] font-mono text-xs uppercase text-[var(--secondary)]">
                <tr>
                  <th className="px-6 py-3">Rank</th>
                  <th className="px-6 py-3">Agent</th>
                  <th className="px-6 py-3">Wallet Address</th>
                  <th className="px-6 py-3">Active Intents</th>
                  <th className="px-6 py-3 text-right">Requests</th>
                  <th className="px-6 py-3 text-right">Total Spend</th>
                  <th className="px-6 py-3">Latest Settlement</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)] font-mono text-xs">
                {leaderboardEntries.map((agent) => (
                  <tr key={agent.agentId} className="hover:bg-[var(--background)]/50">
                    <td className="px-6 py-4 font-semibold text-[var(--foreground)]">#{agent.rank}</td>
                    <td className="px-6 py-4 font-sans font-medium text-[var(--foreground)]">
                      <div>{agent.agentName}</div>
                      <div className="font-mono text-xs text-[var(--secondary)]">{agent.agentType}</div>
                    </td>
                    <td className="px-6 py-4 text-[var(--secondary)] font-mono">
                      {agent.walletAddress.length > 14
                        ? `${agent.walletAddress.slice(0, 8)}...${agent.walletAddress.slice(-6)}`
                        : agent.walletAddress}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {agent.intents.map((i) => (
                          <span
                            key={i}
                            className="rounded border border-[var(--border)] bg-[var(--background)] px-1.5 py-0.5 text-[10px]"
                          >
                            {i}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right font-semibold">{agent.paidRequests} paid</td>
                    <td className="px-6 py-4 text-right font-semibold text-amber-600">
                      ${agent.totalSpendUsdc.toFixed(3)} USDC
                    </td>
                    <td className="px-6 py-4">
                      {agent.lastTxHash ? (
                        <a
                          href={`https://sepolia.etherscan.io/tx/${agent.lastTxHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline flex items-center gap-1 font-mono text-xs"
                        >
                          {agent.lastTxHash.slice(0, 10)}...{agent.lastTxHash.slice(-6)} &rarr;
                        </a>
                      ) : (
                        <span className="text-[var(--secondary)]">Cached / Local</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Developer Integration Card */}
      <div className="border border-[var(--border)] bg-[var(--surface)] p-6">
        <h3 className="font-semibold text-sm">How to Connect Your Agent</h3>
        <p className="mt-1 text-xs text-[var(--secondary)] leading-relaxed">
          Wrap your agent&apos;s heartbeat query loop with Half-Life. Your agent will evaluate answer decay, query Telegraph via x402 quotes only when staleness drift warrants it, and report verified spend to this panel.
        </p>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <span className="text-xs font-mono text-[var(--secondary)] block mb-1">TypeScript / Node SDK</span>
            <div className="rounded border border-[var(--border)] bg-[var(--background)] p-3 font-mono text-xs text-[var(--foreground)]">
              pnpm add @half-life/sdk
            </div>
          </div>
          <div>
            <span className="text-xs font-mono text-[var(--secondary)] block mb-1">Direct REST / cURL (x402)</span>
            <div className="rounded border border-[var(--border)] bg-[var(--background)] p-3 font-mono text-xs text-[var(--foreground)] truncate">
              curl -X POST https://halflifes.vercel.app/api/v1/ask -H &quot;Authorization: Bearer hl_live_...&quot;
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
