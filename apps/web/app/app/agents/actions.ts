"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { requireUser, getOwnedAgent } from "../../../lib/dal";
import { getDb } from "../../../lib/mongodb";
import { createAgentApiKey } from "../../../lib/api-key";
import { ObjectId } from "mongodb";

export async function createAgentAction(formData: FormData) {
  const user = await requireUser();
  const db = await getDb();

  const name = (formData.get("name") as string)?.trim() || "Untitled Agent";
  const mode = (formData.get("mode") as string) === "naive" ? "naive" : "halflife";
  const perAskCapUsdc = parseFloat(formData.get("perAskCapUsdc") as string) || 0.05;
  const dailyCapUsdc = parseFloat(formData.get("dailyCapUsdc") as string) || 1.00;
  const stakeDefault = parseFloat(formData.get("stakeDefault") as string) || 100.0;

  const allowedIntents = formData.getAll("intents") as string[];

  // Generate wallet
  const privateKey = generatePrivateKey();
  const account = privateKeyToAccount(privateKey);

  const agentDoc = {
    ownerId: user.id,
    name,
    mode,
    walletAddress: account.address,
    walletKeyRef: "local_dev_ref", // In worker flow, encrypted key record is stored in wallet_keys
    allowedIntents: allowedIntents.length > 0 ? allowedIntents : ["FX_NOW"],
    policy: {
      perAskCapUsdc,
      dailyCapUsdc,
      stakeDefault,
    },
    status: "active",
    createdAt: new Date(),
  };

  const insertResult = await db.collection("agents").insertOne(agentDoc);
  const agentId = insertResult.insertedId.toString();

  // Automatically create a secure API key for the new agent
  const { rawKey } = await createAgentApiKey(agentId, user.id);

  revalidatePath("/app/agents");
  redirect(`/app/agents?created=1&agentName=${encodeURIComponent(name)}&rawKey=${encodeURIComponent(rawKey)}`);
}

export async function generateApiKeyAction(agentId: string) {
  const user = await requireUser();
  const agent = await getOwnedAgent(user.id, agentId);
  if (!agent) {
    throw new Error("Agent not found or unauthorized");
  }

  const { rawKey } = await createAgentApiKey(agentId, user.id);

  revalidatePath("/app/agents");
  redirect(`/app/agents?keyGenerated=1&agentName=${encodeURIComponent(agent.name)}&rawKey=${encodeURIComponent(rawKey)}`);
}

export async function toggleAgentStatusAction(agentId: string, currentStatus: string) {
  const user = await requireUser();
  const agent = await getOwnedAgent(user.id, agentId);
  if (!agent) {
    throw new Error("Agent not found or unauthorized");
  }

  const newStatus = currentStatus === "active" ? "paused" : "active";
  const db = await getDb();

  let queryId: string | ObjectId = agentId;
  try {
    queryId = new ObjectId(agentId);
  } catch {}

  await db.collection("agents").updateOne(
    { _id: queryId as unknown as ObjectId, ownerId: user.id },
    { $set: { status: newStatus, pausedBy: newStatus === "paused" ? user.id : null } }
  );

  revalidatePath("/app/agents");
}

export async function getAgentApiKeysAction(agentId: string) {
  const user = await requireUser();
  const agent = await getOwnedAgent(user.id, agentId);
  if (!agent) {
    throw new Error("Agent not found or unauthorized");
  }

  const db = await getDb();
  const keys = await db
    .collection("api_keys")
    .find({ agentId, ownerId: user.id })
    .sort({ createdAt: -1 })
    .toArray();

  return keys.map((k) => ({
    id: k._id.toString(),
    prefix: k.prefix || "hl_live_...",
    scopes: (k.scopes as string[]) || ["read", "ask"],
    status: k.revokedAt ? ("cancelled" as const) : ("active" as const),
    createdAt: k.createdAt ? new Date(k.createdAt).toISOString() : new Date().toISOString(),
    lastUsedAt: k.lastUsedAt ? new Date(k.lastUsedAt).toISOString() : null,
    revokedAt: k.revokedAt ? new Date(k.revokedAt).toISOString() : null,
  }));
}

export async function createAgentApiKeyDirectAction(agentId: string) {
  const user = await requireUser();
  const agent = await getOwnedAgent(user.id, agentId);
  if (!agent) {
    throw new Error("Agent not found or unauthorized");
  }

  const { rawKey, prefix, keyId } = await createAgentApiKey(agentId, user.id);
  revalidatePath("/app/agents");

  return {
    rawKey,
    prefix,
    keyId,
  };
}

export async function cancelAgentApiKeyAction(
  keyId: string,
  agentId: string,
  reason: string = "User manual block",
  confirmationWord?: string
) {
  const user = await requireUser();
  const agent = await getOwnedAgent(user.id, agentId);
  if (!agent) {
    throw new Error("Agent not found or unauthorized");
  }

  if (confirmationWord && confirmationWord.trim().toUpperCase() !== "DELETE") {
    throw new Error("Confirmation failed: You must type 'DELETE' to block this key.");
  }

  const db = await getDb();
  let queryId: string | ObjectId = keyId;
  try {
    queryId = new ObjectId(keyId);
  } catch {}

  const now = new Date();
  const result = await db.collection("api_keys").updateOne(
    { _id: queryId as unknown as ObjectId, ownerId: user.id, agentId },
    {
      $set: {
        revokedAt: now,
        revocationReason: reason.trim(),
        revokedBy: user.id,
      },
    }
  );

  await db.collection("audit_log").insertOne({
    ts: now,
    actorType: "USER",
    actorId: user.id,
    action: "api_key.blocked",
    target: keyId,
    detail: {
      agentId,
      agentName: agent.name,
      reason: reason.trim(),
    },
  });

  revalidatePath("/app/agents");
  revalidatePath("/app");

  return {
    success: result.modifiedCount > 0,
  };
}
