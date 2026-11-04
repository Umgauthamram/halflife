import Link from "next/link";
import { getDb } from "../../../lib/mongodb";
import { requireUser } from "../../../lib/dal";
import { toggleAgentStatusAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function AgentsPage() {
  const user = await requireUser();
  const db = await getDb();

  const agents = await db
    .collection("agents")
    .find({ ownerId: user.id })
    .sort({ createdAt: -1 })
    .toArray();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Agents</h1>
          <p className="mt-1 text-sm text-[var(--secondary)]">
            Configure spending policies, wallet addresses, and pause controls for your agents.
          </p>
        </div>
        <Link
          href="/app/agents/new"
          className="rounded border border-[var(--border-strong)] bg-[var(--foreground)] px-4 py-2 text-sm font-medium text-[var(--background)] hover:opacity-90"
        >
          Create Agent
        </Link>
      </div>

      {agents.length === 0 ? (
        <div className="border border-[var(--border)] bg-[var(--surface)] p-12 text-center">
          <p className="text-sm text-[var(--secondary)]">You haven&apos;t created any agents yet.</p>
          <div className="mt-4">
            <Link
              href="/app/agents/new"
              className="inline-flex rounded border border-[var(--border-strong)] bg-[var(--foreground)] px-4 py-2 text-sm font-medium text-[var(--background)] hover:opacity-90"
            >
              Create your first agent
            </Link>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto border border-[var(--border)] bg-[var(--surface)]">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-[var(--border)] bg-[var(--background)] font-mono text-xs text-[var(--secondary)]">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Mode</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Wallet Address (Sepolia)</th>
                <th className="px-4 py-3 text-right">Daily Cap</th>
                <th className="px-4 py-3 text-right">Per-Ask Cap</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {agents.map((agent) => {
                const agentId = agent._id.toString();
                const isPaused = agent.status === "paused";
                return (
                  <tr key={agentId} className="hover:bg-[var(--background)]">
                    <td className="px-4 py-3 font-medium">{agent.name}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded px-2 py-0.5 text-xs font-mono uppercase ${
                          agent.mode === "halflife"
                            ? "border border-green-800 bg-green-50 text-green-800"
                            : "border border-gray-400 bg-gray-100 text-gray-700"
                        }`}
                      >
                        {agent.mode}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded px-2 py-0.5 text-xs font-mono uppercase ${
                          !isPaused
                            ? "text-[var(--success)]"
                            : "text-[var(--error)]"
                        }`}
                      >
                        {agent.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-[var(--secondary)]">
                      {agent.walletAddress
                        ? `${agent.walletAddress.slice(0, 8)}...${agent.walletAddress.slice(-6)}`
                        : "Generating..."}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-xs">
                      ${agent.policy?.dailyCapUsdc?.toFixed(2) ?? "1.00"}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-xs">
                      ${agent.policy?.perAskCapUsdc?.toFixed(3) ?? "0.050"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <form action={toggleAgentStatusAction.bind(null, agentId, agent.status)}>
                        <button
                          type="submit"
                          className="rounded border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1 text-xs font-mono text-[var(--secondary)] hover:text-[var(--foreground)]"
                        >
                          {isPaused ? "Resume" : "Pause"}
                        </button>
                      </form>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

