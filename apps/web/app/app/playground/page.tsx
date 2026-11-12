import { requireUser } from "../../../lib/dal";
import { getDb } from "../../../lib/mongodb";
import PlaygroundClient from "./playground-client";

export const dynamic = "force-dynamic";

export default async function PlaygroundPage() {
  const user = await requireUser();
  const db = await getDb();

  const agents = await db
    .collection("agents")
    .find({ ownerId: user.id, status: "active" })
    .toArray();

  const keys = await db
    .collection("api_keys")
    .find({ ownerId: user.id, revokedAt: { $exists: false } })
    .sort({ createdAt: -1 })
    .toArray();

  const fullKeysByAgentId = new Map<string, string>();
  for (const k of keys) {
    if (k.agentId && !fullKeysByAgentId.has(k.agentId) && k.key) {
      fullKeysByAgentId.set(k.agentId, k.key);
    }
  }

  // Ensure every active agent has a full active working key for sandbox testing
  for (const ag of agents) {
    const agentId = ag._id.toString();
    if (!fullKeysByAgentId.has(agentId)) {
      const { createAgentApiKey } = await import("../../../lib/api-key");
      const { rawKey } = await createAgentApiKey(agentId, user.id);
      fullKeysByAgentId.set(agentId, rawKey);
    }
  }

  const userAgents = agents.map((ag) => ({
    id: ag._id.toString(),
    name: ag.name,
    fullKey: fullKeysByAgentId.get(ag._id.toString()) || "",
  }));

  const hasGeminiKey = Boolean(process.env.GEMINI_API_KEY?.trim());
  const initialDefaultKey = userAgents[0]?.fullKey || process.env.api || "";

  return (
    <PlaygroundClient
      userAgents={userAgents}
      defaultApiKey={initialDefaultKey}
      hasGeminiKey={hasGeminiKey}
    />
  );
}

