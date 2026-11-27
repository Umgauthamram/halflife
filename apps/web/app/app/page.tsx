import { getDb } from "../../lib/mongodb";
import { requireUser } from "../../lib/dal";
import { computeMedianPaidLatencyMs } from "../../lib/metrics";
import { DEFAULT_SAMPLER_INTENTS, mergeIntents } from "@half-life/shared";
import DashboardClient, {
  type DashboardCallItem,
  type DashboardKeyItem,
} from "./dashboard-client";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await requireUser();
  const db = await getDb();

  const [agents, apiKeys, decisions, playgroundRuns, purchaseLatencies] = await Promise.all([
    db.collection("agents").find({ ownerId: user.id }).toArray(),
    db.collection("api_keys").find({ ownerId: user.id }).sort({ createdAt: -1 }).toArray(),
    db.collection("decisions").find({ ownerId: user.id }).sort({ createdAt: -1 }).limit(100).toArray(),
    db.collection("playground_runs").find({ userId: user.id }).sort({ createdAt: -1 }).limit(100).toArray(),
    db
      .collection("purchases")
      .find(
        { ownerId: user.id, outcome: "paid", latencyMs: { $type: "number" } },
        { projection: { outcome: 1, latencyMs: 1 } }
      )
      .toArray(),
  ]);

  const medianLatencyMs = computeMedianPaidLatencyMs(
    purchaseLatencies.map((p) => ({ outcome: p.outcome, latencyMs: p.latencyMs }))
  );

  const agentMap = new Map<string, string>();
  for (const ag of agents) {
    agentMap.set(ag._id.toString(), ag.name);
  }

  // Build unified calls list
  const calls: DashboardCallItem[] = [];

  // Decisions (live calls via /api/v1/ask)
  for (const d of decisions) {
    const isBuy = d.action === "buy";
    const priceUsdc = isBuy ? (d.inputs?.price ?? 0.01) : 0;
    const savingsUsdc = d.action === "reuse" ? (d.inputs?.price ?? 0.01) : 0;
    const agentName = agentMap.get(String(d.agentId)) || "Unknown Agent";

    calls.push({
      id: d._id.toString(),
      timestamp: d.createdAt ? new Date(d.createdAt).toISOString() : new Date().toISOString(),
      agentName,
      agentId: String(d.agentId),
      apiKeyPrefix: d.apiKeyPrefix || "hl_live_...",
      intent: d.intent || "unknown",
      action: d.action || "reuse",
      priceUsdc,
      savingsUsdc,
      latencyMs: d.latencyMs ?? null,
      reason: d.reason || "",
      txHash: d.txHash || null,
      source: "API (Live)",
    });
  }

  // Playground Runs
  for (const r of playgroundRuns) {
    calls.push({
      id: r.runId || r._id.toString(),
      timestamp: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString(),
      agentName: r.agentName || agentMap.get(String(r.agentId)) || "Testing Studio",
      agentId: String(r.agentId || ""),
      apiKeyPrefix: r.apiKeyPrefix || "hl_live_...",
      intent: r.intent || "unknown",
      action: r.action || "buy",
      priceUsdc: Number(r.priceUsdc) || 0,
      savingsUsdc: Number(r.savingsUsdc) || 0,
      latencyMs: r.latencyMs ?? null,
      reason: r.reason || "",
      txHash: r.txHash || null,
      source: "Testing Studio",
    });
  }

  // Sort calls chronologically descending
  calls.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  // Compute total spend and savings
  let totalSpendUsdc = 0;
  let totalSavedUsdc = 0;
  for (const c of calls) {
    totalSpendUsdc += c.priceUsdc;
    totalSavedUsdc += c.savingsUsdc;
  }

  // Build keys list
  const keys: DashboardKeyItem[] = apiKeys.map((k) => ({
    id: k._id.toString(),
    prefix: k.prefix || "hl_live_...",
    agentId: String(k.agentId),
    agentName: agentMap.get(String(k.agentId)) || "General Agent",
    status: k.revokedAt ? "blocked" : "active",
    createdAt: k.createdAt ? new Date(k.createdAt).toISOString() : new Date().toISOString(),
    lastUsedAt: k.lastUsedAt ? new Date(k.lastUsedAt).toISOString() : null,
    revokedAt: k.revokedAt ? new Date(k.revokedAt).toISOString() : null,
    revocationReason: k.revocationReason || null,
  }));

  const intentOptions = mergeIntents(
    calls.map((c) => c.intent),
    [...DEFAULT_SAMPLER_INTENTS]
  );

  return (
    <DashboardClient
      calls={calls}
      keys={keys}
      agentsCount={agents.length}
      totalSpendUsdc={totalSpendUsdc}
      totalSavedUsdc={totalSavedUsdc}
      medianLatencyMs={medianLatencyMs}
      intentOptions={intentOptions}
    />
  );
}
