"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { requireUser, getOwnedAgent } from "../../../lib/dal";
import { getDb } from "../../../lib/mongodb";
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

  await db.collection("agents").insertOne(agentDoc);

  revalidatePath("/app/agents");
  redirect("/app/agents");
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

