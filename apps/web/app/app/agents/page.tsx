import Link from "next/link";
import { getDb } from "../../../lib/mongodb";
import { requireUser } from "../../../lib/dal";
import ApiKeyBanner from "./api-key-banner";
import AgentsClient, { type SerializedAgent } from "./agents-client";

export const dynamic = "force-dynamic";

interface AgentsPageProps {
  searchParams: Promise<{
    rawKey?: string;
    agentName?: string;
    created?: string;
    keyGenerated?: string;
  }>;
}

export default async function AgentsPage({ searchParams }: AgentsPageProps) {
  const params = await searchParams;
  const user = await requireUser();
  const db = await getDb();

  const [agents, keys] = await Promise.all([
    db.collection("agents").find({ ownerId: user.id }).sort({ createdAt: -1 }).toArray(),
    db.collection("api_keys").find({ ownerId: user.id }).sort({ createdAt: -1 }).toArray(),
  ]);

  const keysMap: Record<string, string> = {};
  const countsMap: Record<string, number> = {};

  for (const k of keys) {
    if (k.agentId) {
      // Count active keys
      if (!k.revokedAt) {
        countsMap[k.agentId] = (countsMap[k.agentId] || 0) + 1;
        if (!keysMap[k.agentId]) {
          keysMap[k.agentId] = k.prefix;
        }
      }
    }
  }

  const serializedAgents: SerializedAgent[] = agents.map((agent) => ({
    id: agent._id.toString(),
    name: agent.name || "Untitled Agent",
    mode: agent.mode || "halflife",
    status: agent.status || "active",
    walletAddress: agent.walletAddress,
    dailyCapUsdc: agent.policy?.dailyCapUsdc ?? 1.0,
    perAskCapUsdc: agent.policy?.perAskCapUsdc ?? 0.05,
    crossCheck: Boolean(agent.policy?.crossCheck),
  }));

  return (
    <div className="flex flex-col gap-6">
      {/* Newly generated API Key Banner (from creation redirect) */}
      {params.rawKey && (
        <ApiKeyBanner
          rawKey={params.rawKey}
          agentName={params.agentName || "Agent"}
          isNew={Boolean(params.created)}
        />
      )}

      {/* Page Header */}
      <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Agents</h1>
          <p className="mt-1 text-sm text-[var(--secondary)]">
            Configure spending policies, wallet addresses, and API keys for your agents.
          </p>
        </div>
        <Link
          href="/app/agents/new"
          className="rounded border border-[var(--border-strong)] bg-[var(--foreground)] px-4 py-2 text-sm font-medium text-[var(--background)] hover:opacity-90 transition"
        >
          Create Agent
        </Link>
      </div>

      {serializedAgents.length === 0 ? (
        <div className="border border-[var(--border)] bg-[var(--surface)] p-12 text-center">
          <p className="text-sm text-[var(--secondary)]">You haven&apos;t created any agents yet.</p>
          <div className="mt-4">
            <Link
              href="/app/agents/new"
              className="inline-flex rounded border border-[var(--border-strong)] bg-[var(--foreground)] px-4 py-2 text-sm font-medium text-[var(--background)] hover:opacity-90 transition"
            >
              Create your first agent
            </Link>
          </div>
        </div>
      ) : (
        <AgentsClient
          initialAgents={serializedAgents}
          initialKeysMap={keysMap}
          initialCountsMap={countsMap}
        />
      )}
    </div>
  );
}
