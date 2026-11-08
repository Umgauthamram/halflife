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

  const keysByAgentId = new Map<string, string>();
  for (const k of keys) {
    if (k.agentId && !keysByAgentId.has(k.agentId)) {
      keysByAgentId.set(k.agentId, k.prefix);
    }
  }

  const userAgents = agents.map((ag) => ({
    id: ag._id.toString(),
    name: ag.name,
    prefix: keysByAgentId.get(ag._id.toString()),
  }));

  const hasGeminiKey = Boolean(process.env.GEMINI_API_KEY?.trim());

  return (
    <PlaygroundClient
      userAgents={userAgents}
      defaultApiKey={process.env.api || ""}
      hasGeminiKey={hasGeminiKey}
    />
  );
}

