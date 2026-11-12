import { requireUser } from "../../../lib/dal";
import { getDb } from "../../../lib/mongodb";
import { createAgentApiKey } from "../../../lib/api-key";
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
  const prefixesByAgentId = new Map<string, string>();

  for (const k of keys) {
    const agId = String(k.agentId);
    if (agId && !prefixesByAgentId.has(agId) && k.prefix) {
      prefixesByAgentId.set(agId, k.prefix);
    }
    if (agId && !fullKeysByAgentId.has(agId) && k.key) {
      fullKeysByAgentId.set(agId, k.key);
    }
  }

  // Ensure every active agent has a full active working key for sandbox testing
  for (const ag of agents) {
    const agentId = ag._id.toString();
    if (!fullKeysByAgentId.has(agentId)) {
      const existingPrefix = prefixesByAgentId.get(agentId);
      if (existingPrefix && process.env.api && process.env.api.startsWith(existingPrefix)) {
        fullKeysByAgentId.set(agentId, process.env.api);
        await db.collection("api_keys").updateOne(
          { agentId, prefix: existingPrefix },
          { $set: { key: process.env.api } }
        );
      } else {
        const { rawKey } = await createAgentApiKey(agentId, user.id);
        fullKeysByAgentId.set(agentId, rawKey);
      }
    }
  }

  const userAgents = agents.map((ag) => {
    const agentId = ag._id.toString();
    return {
      id: agentId,
      name: ag.name,
      fullKey: fullKeysByAgentId.get(agentId) || "",
      prefix: prefixesByAgentId.get(agentId) || "",
    };
  });

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

